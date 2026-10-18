'use client';
// Main video editor page
import { useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { DEFAULT_TEXT_STYLE } from "@/lib/editor/constants";
import {
  startAutosave,
  stopAutosave,
  forceSave,
  hasRecoverableAutosave,
  type AutosaveSnapshot,
} from "@/lib/editor/autosave";
import { restoreAllMediaFromIDB, persistMediaToIDB } from "@/lib/editor/idb-storage";
import EditorHeader from "@/components/editor/editor-header";
import ToolsSidebar from "@/components/editor/tools-sidebar";
import PreviewCanvas from "@/components/editor/preview-canvas";
import InspectorPanel from "@/components/editor/inspector-panel";
import TimelinePanel from "@/components/editor/timeline-panel";
import ShortcutsDialog from "@/components/editor/shortcuts-dialog";
import ExportDialog from "@/components/editor/export-dialog";
import UserGuideDialog from "@/components/editor/user-guide-dialog";
import RecoveryDialog from "@/components/editor/recovery-dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";

export default function Home() {
  const project = useEditorStore((s) => s.project);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recoverySnapshot, setRecoverySnapshot] = useState<AutosaveSnapshot | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Handlers passed to keyboard shortcuts hook (kept stable via useCallback)
  const onShowShortcuts = useCallback(() => setShowShortcuts(true), []);
  const onShowGuide = useCallback(() => setShowGuide(true), []);
  const onOpenExport = useCallback(() => setShowExport(true), []);
  const onToggleFullscreen = useCallback(() => {
    const el = document.querySelector("video, canvas") as HTMLElement | null;
    if (!document.fullscreenElement) {
      (el ?? document.documentElement).requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);
  const onAddText = useCallback(() => {
    const store = useEditorStore.getState();
    const textTrack = store.tracks.find((t) => t.kind === "text") ?? store.tracks[0];
    if (!textTrack) {
      toast.error("No text track available");
      return;
    }
    const clip = store.createTextClip("Your Text", { ...DEFAULT_TEXT_STYLE, preset: "clean" }, textTrack.id, store.playhead);
    store.addClip(clip);
    toast.success("Text added (T)");
  }, []);
  const onSaveProject = useCallback(() => {
    const state = useEditorStore.getState();
    const data = {
      project: state.project,
      tracks: state.tracks,
      mediaLibrary: state.mediaLibrary.filter((m) => !m.url.startsWith("blob:")),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.project.name.replace(/[^a-z0-9_\-]+/gi, "_").toLowerCase() || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project saved");
  }, []);
  const onOpenProject = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        if (!data.project || !data.tracks) throw new Error("Invalid project file");
        useEditorStore.setState({
          project: data.project,
          tracks: data.tracks,
          mediaLibrary: data.mediaLibrary ?? [],
          history: [],
          historyIndex: -1,
        });
        useEditorStore.getState().pushHistory();
        useEditorStore.getState().recalculateDuration();
        toast.success("Project loaded");
      } catch (err) {
        toast.error("Failed to load project: " + (err as Error).message);
      }
    };
    input.click();
  }, []);

  // Wire up keyboard shortcuts
  useEditorShortcuts({
    onOpenExport,
    onShowShortcuts,
    onShowGuide,
    onSaveProject,
    onOpenProject,
    onAddText,
    onToggleFullscreen,
  });

  // Push initial empty history snapshot on mount + start autosave + check for recovery
  useEffect(() => {
    // 1. Check for recoverable autosave FIRST (before pushing initial history)
    const snap = hasRecoverableAutosave();
    if (snap) {
      setRecoverySnapshot(snap);
    }

    // 2. Restore media from IndexedDB (silent — does not overwrite user choice)
    restoreAllMediaFromIDB().then((restoredMedia) => {
      if (restoredMedia.length > 0) {
        const existing = useEditorStore.getState().mediaLibrary;
        const existingIds = new Set(existing.map((m) => m.id));
        const toAdd = restoredMedia.filter((m) => !existingIds.has(m.id));
        if (toAdd.length > 0) {
          useEditorStore.setState({
            mediaLibrary: [...existing, ...toAdd],
          });
          toast.info(`Restored ${toAdd.length} media file${toAdd.length > 1 ? "s" : ""} from local storage`);
        }
      }
      setIsReady(true);
    }).catch(() => setIsReady(true));

    // 3. Push initial history
    const s = useEditorStore.getState();
    if (s.history.length === 0) {
      s.pushHistory();
    }

    // 4. Start autosave timer
    startAutosave();

    // 5. Save on tab close
    const onBeforeUnload = () => {
      forceSave();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // 6. Persist new media to IDB when library changes (debounced via effect)
    return () => {
      stopAutosave();
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  // Persist any new blob-URL media to IndexedDB (so it survives reload)
  const mediaLibrary = useEditorStore((s) => s.mediaLibrary);
  useEffect(() => {
    if (!isReady) return;
    // Only persist blob: URLs (which are user uploads that need to survive reload)
    const blobMedia = mediaLibrary.filter((m) => m.url.startsWith("blob:"));
    if (blobMedia.length === 0) return;
    // Persist each (silently — failures are non-critical)
    let cancelled = false;
    Promise.all(blobMedia.map((m) => persistMediaToIDB(m).catch(() => {})))
      .then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [mediaLibrary, isReady]);

  // Apply theme to document body
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (project.theme === "holiday") {
      document.documentElement.style.setProperty("--background", "#0a1931");
      document.documentElement.style.setProperty("--foreground", "#FFD700");
      document.documentElement.style.setProperty("--card", "#132a5a");
      document.documentElement.style.setProperty("--card-foreground", "#FFD700");
      document.documentElement.style.setProperty("--muted", "#1a3358");
      document.documentElement.style.setProperty("--muted-foreground", "#a5b4cc");
      document.documentElement.style.setProperty("--border", "#1a3358");
      document.documentElement.style.setProperty("--input", "#1a3358");
      document.documentElement.style.setProperty("--primary", "#FFD700");
      document.documentElement.style.setProperty("--primary-foreground", "#0a1931");
      document.documentElement.style.setProperty("--secondary", "#1a3358");
      document.documentElement.style.setProperty("--secondary-foreground", "#FFD700");
      document.documentElement.style.setProperty("--accent", "#1a3358");
      document.documentElement.style.setProperty("--accent-foreground", "#FFD700");
      document.documentElement.style.setProperty("--popover", "#132a5a");
      document.documentElement.style.setProperty("--popover-foreground", "#FFD700");
      document.documentElement.style.setProperty("--ring", "#FFD700");
      document.documentElement.style.setProperty("--sidebar", "#132a5a");
      document.documentElement.style.setProperty("--sidebar-foreground", "#FFD700");
      document.documentElement.style.setProperty("--sidebar-primary", "#FFD700");
      document.documentElement.style.setProperty("--sidebar-primary-foreground", "#0a1931");
      document.documentElement.style.setProperty("--sidebar-accent", "#1a3358");
      document.documentElement.style.setProperty("--sidebar-accent-foreground", "#FFD700");
      document.documentElement.style.setProperty("--sidebar-border", "#1a3358");
      document.documentElement.style.setProperty("--sidebar-ring", "#FFD700");
      document.body.style.backgroundColor = "#0a1931";
      document.body.style.color = "#FFD700";
    } else if (project.theme === "studio") {
      // Premium "Studio" theme: midnight navy + charcoal + slate + subtle blue accent
      document.documentElement.style.setProperty("--background", "#0b1220"); // midnight navy
      document.documentElement.style.setProperty("--foreground", "#e2e8f0"); // slate-200
      document.documentElement.style.setProperty("--card", "#111827"); // charcoal
      document.documentElement.style.setProperty("--card-foreground", "#e2e8f0");
      document.documentElement.style.setProperty("--muted", "#1e293b"); // slate-800
      document.documentElement.style.setProperty("--muted-foreground", "#94a3b8"); // slate-400
      document.documentElement.style.setProperty("--border", "#1e293b");
      document.documentElement.style.setProperty("--input", "#1e293b");
      document.documentElement.style.setProperty("--primary", "#3b82f6"); // blue-500 accent
      document.documentElement.style.setProperty("--primary-foreground", "#ffffff");
      document.documentElement.style.setProperty("--secondary", "#1e293b");
      document.documentElement.style.setProperty("--secondary-foreground", "#e2e8f0");
      document.documentElement.style.setProperty("--accent", "#1e3a8a"); // blue-900 deeper
      document.documentElement.style.setProperty("--accent-foreground", "#dbeafe"); // blue-100
      document.documentElement.style.setProperty("--popover", "#111827");
      document.documentElement.style.setProperty("--popover-foreground", "#e2e8f0");
      document.documentElement.style.setProperty("--ring", "#3b82f6");
      document.documentElement.style.setProperty("--sidebar", "#0f172a"); // slate-900
      document.documentElement.style.setProperty("--sidebar-foreground", "#e2e8f0");
      document.documentElement.style.setProperty("--sidebar-primary", "#3b82f6");
      document.documentElement.style.setProperty("--sidebar-primary-foreground", "#ffffff");
      document.documentElement.style.setProperty("--sidebar-accent", "#1e293b");
      document.documentElement.style.setProperty("--sidebar-accent-foreground", "#e2e8f0");
      document.documentElement.style.setProperty("--sidebar-border", "#1e293b");
      document.documentElement.style.setProperty("--sidebar-ring", "#3b82f6");
      document.body.style.backgroundColor = "#0b1220";
      document.body.style.color = "#e2e8f0";
    } else {
      document.documentElement.style.setProperty("--background", "#0f0f10");
      document.documentElement.style.setProperty("--foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--card", "#1c1c1e");
      document.documentElement.style.setProperty("--card-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--muted", "#27272a");
      document.documentElement.style.setProperty("--muted-foreground", "#a1a1aa");
      document.documentElement.style.setProperty("--border", "#27272a");
      document.documentElement.style.setProperty("--input", "#27272a");
      document.documentElement.style.setProperty("--primary", "#f5f5f5");
      document.documentElement.style.setProperty("--primary-foreground", "#0f0f10");
      document.documentElement.style.setProperty("--secondary", "#27272a");
      document.documentElement.style.setProperty("--secondary-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--accent", "#3f3f46");
      document.documentElement.style.setProperty("--accent-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--popover", "#1c1c1e");
      document.documentElement.style.setProperty("--popover-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--ring", "#a1a1aa");
      document.documentElement.style.setProperty("--sidebar", "#1c1c1e");
      document.documentElement.style.setProperty("--sidebar-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--sidebar-primary", "#f5f5f5");
      document.documentElement.style.setProperty("--sidebar-primary-foreground", "#0f0f10");
      document.documentElement.style.setProperty("--sidebar-accent", "#3f3f46");
      document.documentElement.style.setProperty("--sidebar-accent-foreground", "#e4e4e7");
      document.documentElement.style.setProperty("--sidebar-border", "#27272a");
      document.documentElement.style.setProperty("--sidebar-ring", "#a1a1aa");
      document.body.style.backgroundColor = "#0f0f10";
      document.body.style.color = "#e4e4e7";
    }
  }, [project.theme]);

  // Load Google Fonts for text panel
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Bebas+Neue&family=Anton&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <EditorHeader />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70} minSize={30}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
                <ToolsSidebar className="h-full" />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={64} minSize={30}>
                <PreviewCanvas className="h-full p-3" />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={18} minSize={12} maxSize={32}>
                <InspectorPanel className="h-full" />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={12}>
            <TimelinePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Floating shortcuts hint badge (bottom-left) */}
      <div className="fixed bottom-3 left-3 z-30 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card/90 border border-border text-[10px] text-muted-foreground backdrop-blur shadow-lg">
        <kbd className="font-mono">?</kbd>
        <span>Shortcuts</span>
      </div>

      {/* Dialogs also triggerable from header buttons */}
      {showShortcuts && <ShortcutsDialog open={true} onClose={() => setShowShortcuts(false)} />}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showGuide && <UserGuideDialog open={true} onClose={() => setShowGuide(false)} />}
      {recoverySnapshot && (
        <RecoveryDialog snapshot={recoverySnapshot} onDismiss={() => setRecoverySnapshot(null)} />
      )}
    </div>
  );
}
