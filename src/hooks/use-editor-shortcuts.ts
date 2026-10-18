'use client';
// Global keyboard shortcuts hook for the video editor
import { useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";

export interface ShortcutHandlers {
  onOpenExport?: () => void;
  onShowShortcuts?: () => void;
  onShowGuide?: () => void;
  onSaveProject?: () => void;
  onOpenProject?: () => void;
  onAddText?: () => void;
  onToggleFullscreen?: () => void;
}

/**
 * Wires up all global keyboard shortcuts.
 * Call once in the root editor component.
 */
export function useEditorShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs / contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          // Allow Escape to blur the input only
          if (e.key === "Escape") {
            (target as HTMLElement).blur();
            return;
          }
          return;
        }
      }

      const store = useEditorStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key;
      const lower = key.toLowerCase();

      // Cmd/Ctrl+S - save project
      if (mod && lower === "s") {
        e.preventDefault();
        handlers.onSaveProject?.();
        return;
      }
      // Cmd/Ctrl+O - open project
      if (mod && lower === "o") {
        e.preventDefault();
        handlers.onOpenProject?.();
        return;
      }
      // Cmd/Ctrl+E - export
      if (mod && lower === "e") {
        e.preventDefault();
        handlers.onOpenExport?.();
        return;
      }
      // Cmd/Ctrl+Z - undo (or redo with shift)
      if (mod && lower === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
        return;
      }
      // Cmd/Ctrl+Y - redo
      if (mod && lower === "y") {
        e.preventDefault();
        store.redo();
        return;
      }
      // Cmd/Ctrl+C - copy
      if (mod && lower === "c") {
        // Allow native copy if user has text selected in non-input area
        const sel = window.getSelection?.();
        if (sel && sel.toString().length > 0) return;
        e.preventDefault();
        store.copyClip();
        return;
      }
      // Cmd/Ctrl+V - paste
      if (mod && lower === "v") {
        e.preventDefault();
        store.pasteClip();
        return;
      }
      // Cmd/Ctrl+D - duplicate
      if (mod && lower === "d") {
        e.preventDefault();
        store.duplicateClip();
        return;
      }
      // Cmd/Ctrl+A - select all clips on current track
      if (mod && lower === "a") {
        e.preventDefault();
        const sel = store.selectedClipId;
        const clip = sel ? store.findClip(sel) : null;
        const targetTrackId = clip?.trackId ?? store.tracks[0]?.id;
        if (targetTrackId) {
          const t = store.findTrack(targetTrackId);
          if (t && t.clips.length > 0) {
            // Select all clips on the track
            store.selectClips(t.clips.map((c) => c.id));
          }
        }
        return;
      }
      // Cmd/Ctrl+Shift+A - deselect all
      if (mod && e.shiftKey && lower === "a") {
        e.preventDefault();
        store.clearSelection();
        return;
      }

      // ? - show shortcuts
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        handlers.onShowShortcuts?.();
        return;
      }
      // H or F1 - show user guide
      if (lower === "h" || key === "F1") {
        e.preventDefault();
        handlers.onShowGuide?.();
        return;
      }

      // Arrow keys: handle BEFORE the "if (mod) return" gate so Ctrl+Arrow works for nudging
      if (key === "ArrowLeft" || key === "ArrowRight") {
        // Ctrl held + clip selected: nudge the clip
        if (mod && store.selectedClipId) {
          e.preventDefault();
          const dir = key === "ArrowLeft" ? -1 : 1;
          const step = e.shiftKey ? 1 : 1 / store.project.fps;
          store.nudgeClip(store.selectedClipId, dir * step);
          return;
        }
        // No Ctrl: move playhead
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / store.project.fps;
        store.setPlayhead(key === "ArrowLeft" ? Math.max(0, store.playhead - step) : Math.min(store.duration, store.playhead + step));
        store.setIsPlaying(false);
        return;
      }
      if (key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        const sel = store.selectedClipId;
        let trackIdx = -1;
        if (sel) {
          const clip = store.findClip(sel);
          if (clip) trackIdx = store.tracks.findIndex((t) => t.id === clip.trackId);
        }
        const dir = key === "ArrowUp" ? -1 : 1;
        const newIdx = Math.max(0, Math.min(store.tracks.length - 1, (trackIdx === -1 ? 0 : trackIdx) + dir));
        const newTrack = store.tracks[newIdx];
        if (newTrack && newTrack.clips.length > 0) {
          store.selectClip(newTrack.clips[0].id);
        }
        return;
      }

      // Single key shortcuts (only when no modifier held, except shift)
      if (mod) return;

      // Space - play/pause
      if (key === " " || key === "Spacebar") {
        e.preventDefault();
        store.setIsPlaying(!store.isPlaying);
        return;
      }
      // Delete/Backspace - remove selected clip (Shift+Delete = ripple delete)
      if (key === "Delete" || key === "Backspace") {
        if (store.selectedClipId) {
          e.preventDefault();
          // Multi-select delete if there are multiple selected
          if (store.selectedClipIds.length > 1) {
            store.deleteSelected();
          } else if (e.shiftKey) {
            // Ripple delete: shift later clips left
            store.rippleDelete(store.selectedClipId);
          } else {
            store.removeClip(store.selectedClipId);
          }
        }
        return;
      }
      // Escape - deselect
      if (key === "Escape") {
        store.clearSelection();
        return;
      }
      // Home - go to start
      if (key === "Home") {
        e.preventDefault();
        store.setPlayhead(0);
        store.setIsPlaying(false);
        return;
      }
      // End - go to end
      if (key === "End") {
        e.preventDefault();
        store.setPlayhead(store.duration);
        store.setIsPlaying(false);
        return;
      }
      // S - split at playhead
      if (lower === "s") {
        e.preventDefault();
        if (store.selectedClipId) {
          store.splitClip(store.selectedClipId, store.playhead);
        }
        return;
      }
      // T - add text
      if (lower === "t") {
        e.preventDefault();
        handlers.onAddText?.();
        return;
      }
      // + / = - zoom in
      if (key === "+" || key === "=") {
        e.preventDefault();
        store.setZoom(store.zoom * 1.25);
        return;
      }
      // - - zoom out
      if (key === "-" || key === "_") {
        e.preventDefault();
        store.setZoom(store.zoom * 0.8);
        return;
      }
      // F - fullscreen
      if (lower === "f") {
        e.preventDefault();
        handlers.onToggleFullscreen?.();
        return;
      }
      // L - toggle loop placeholder (no-op for now)
      if (lower === "l") {
        // Could implement loop toggle in future
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
