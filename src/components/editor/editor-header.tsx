'use client';
// Editor header - project name, settings, theme toggle, export, undo/redo, shortcuts
import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { ASPECT_RATIOS, FRAME_RATES, DEFAULT_TEXT_STYLE } from "@/lib/editor/constants";
import {
  Download,
  Film,
  Palette,
  Settings2,
  Wand2,
  Undo2,
  Redo2,
  Keyboard,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Save,
  FolderOpen,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import ExportDialog from "./export-dialog";
import ShortcutsDialog from "./shortcuts-dialog";
import UserGuideDialog from "./user-guide-dialog";

export default function EditorHeader() {
  const project = useEditorStore((s) => s.project);
  const setTheme = useEditorStore((s) => s.setTheme);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const setFps = useEditorStore((s) => s.setFps);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const loadSampleProject = useEditorStore((s) => s.loadSampleProject);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.historyIndex > 0);
  const canRedo = useEditorStore((s) => s.historyIndex < s.history.length - 1);
  const historyLength = useEditorStore((s) => s.history.length);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const splitClip = useEditorStore((s) => s.splitClip);
  const playhead = useEditorStore((s) => s.playhead);
  const copyClip = useEditorStore((s) => s.copyClip);
  const pasteClip = useEditorStore((s) => s.pasteClip);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const tracks = useEditorStore((s) => s.tracks);
  const createTextClip = useEditorStore((s) => s.createTextClip);
  const addClip = useEditorStore((s) => s.addClip);

  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Save / Load project as JSON
  const saveProject = () => {
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
    a.download = `${project.name.replace(/[^a-z0-9_\-]+/gi, "_").toLowerCase() || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project saved (downloaded JSON)");
  };

  const openProject = () => {
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
  };

  // Add text via T shortcut
  const addTextClip = () => {
    const textTrack = tracks.find((t) => t.kind === "text") ?? tracks[0];
    if (!textTrack) {
      toast.error("No text track available");
      return;
    }
    const clip = createTextClip("Your Text", { ...DEFAULT_TEXT_STYLE, preset: "clean" }, textTrack.id, playhead);
    addClip(clip);
    toast.success("Text added (press T again to add more)");
  };

  // Expose handlers via window so useEditorShortcuts hook (in page.tsx) can call them
  // We'll use a simpler approach: pass via ref or state. For now, we use a custom event.
  // Better: page.tsx wires up the hook itself.

  return (
    <TooltipProvider delayDuration={400}>
      <header className="flex items-center gap-3 px-3 py-2 border-b border-border bg-card/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Film className="w-4 h-4 text-primary-foreground" />
          </div>
          <Input
            value={project.name}
            onChange={(e) => setProjectName(e.target.value)}
            className="h-8 w-48 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-1 ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
          <span className="text-[10px] text-muted-foreground ml-1 hidden md:inline">
            {historyLength > 0 ? `${historyLength} action${historyLength > 1 ? "s" : ""}` : ""}
          </span>
        </div>

        <div className="h-5 w-px bg-border mx-1 hidden md:block" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => selectedClipId && splitClip(selectedClipId, playhead)}
                disabled={!selectedClipId}
              >
                <Scissors className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split at playhead (S)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyClip} disabled={!selectedClipId}>
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy (Ctrl+C)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={pasteClip}>
                <ClipboardPaste className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Paste (Ctrl+V)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={duplicateClip} disabled={!selectedClipId}>
                <Wand2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate (Ctrl+D)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => selectedClipId && removeClip(selectedClipId)}
                disabled={!selectedClipId}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete (Del)</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-5 w-px bg-border mx-1 hidden md:block" />

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Settings2 className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">{project.aspectRatio}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Aspect Ratio</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ASPECT_RATIOS.map((a) => (
                <DropdownMenuItem
                  key={a.value}
                  onClick={() => setAspectRatio(a.value as any)}
                  className={project.aspectRatio === a.value ? "bg-accent" : ""}
                >
                  <span className="flex-1">{a.label}</span>
                  <span className="text-xs text-muted-foreground">{a.w}×{a.h}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Frame Rate</DropdownMenuLabel>
              {FRAME_RATES.map((f) => (
                <DropdownMenuItem
                  key={f}
                  onClick={() => setFps(f as any)}
                  className={project.fps === f ? "bg-accent" : ""}
                >
                  {f} FPS
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Palette className="w-3.5 h-3.5" />
                <span className="text-xs capitalize hidden sm:inline">{project.theme}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setTheme("studio")}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-[#0b1220] via-[#111827] to-[#3b82f6]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Studio (Recommended)</span>
                    <span className="text-[10px] text-muted-foreground">Midnight navy + blue accent</span>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("holiday")}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-[#FFD700] to-[#0a1931]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Holiday</span>
                    <span className="text-[10px] text-muted-foreground">Gold + dark blue</span>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("pro")}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-800 to-zinc-900" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Pro</span>
                    <span className="text-[10px] text-muted-foreground">Neutral slate</span>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => { loadSampleProject(); toast.success("Sample project loaded"); }}>
                <Wand2 className="w-3.5 h-3.5" /> <span className="text-xs hidden sm:inline">Demo</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load sample project</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveProject}>
                <Save className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save project (Ctrl+S)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openProject}>
                <FolderOpen className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open project (Ctrl+O)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(true)}>
                <Keyboard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shortcuts (?)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setShowGuide(true)}>
                <BookOpen className="w-3.5 h-3.5" /> <span className="text-xs hidden sm:inline">Guide</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>User Guide (H)</TooltipContent>
          </Tooltip>
          <Button variant="default" size="sm" className="h-8 gap-2" onClick={() => setShowExport(true)}>
            <Download className="w-3.5 h-3.5" /> <span className="text-xs hidden sm:inline">Export</span>
          </Button>
        </div>

        {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
        {showShortcuts && <ShortcutsDialog open={true} onClose={() => setShowShortcuts(false)} />}
        {showGuide && <UserGuideDialog open={true} onClose={() => setShowGuide(false)} />}
      </header>
    </TooltipProvider>
  );
}
