// All keyboard shortcuts - single source of truth
export interface ShortcutDef {
  keys: string; // e.g., "Delete", "Cmd+Z", "Shift+?"
  description: string;
  category: "Playback" | "Editing" | "Timeline" | "View" | "File";
}

export const SHORTCUTS: ShortcutDef[] = [
  // Playback
  { keys: "Space", description: "Play / Pause", category: "Playback" },
  { keys: "←", description: "Step back 1 frame", category: "Playback" },
  { keys: "→", description: "Step forward 1 frame", category: "Playback" },
  { keys: "Shift+←", description: "Jump back 1 second", category: "Playback" },
  { keys: "Shift+→", description: "Jump forward 1 second", category: "Playback" },
  { keys: "Home", description: "Jump to start", category: "Playback" },
  { keys: "End", description: "Jump to end", category: "Playback" },
  { keys: "L", description: "Toggle loop (placeholder)", category: "Playback" },

  // Editing
  { keys: "Delete", description: "Delete selected clip(s)", category: "Editing" },
  { keys: "Backspace", description: "Delete selected clip(s)", category: "Editing" },
  { keys: "Shift+Delete", description: "Ripple delete (shift later clips left)", category: "Editing" },
  { keys: "Cmd/Ctrl+Z", description: "Undo", category: "Editing" },
  { keys: "Cmd/Ctrl+Y", description: "Redo", category: "Editing" },
  { keys: "Cmd/Ctrl+Shift+Z", description: "Redo", category: "Editing" },
  { keys: "Cmd/Ctrl+C", description: "Copy selected clip", category: "Editing" },
  { keys: "Cmd/Ctrl+V", description: "Paste clip at playhead", category: "Editing" },
  { keys: "Cmd/Ctrl+D", description: "Duplicate selected clip", category: "Editing" },
  { keys: "S", description: "Split clip at playhead", category: "Editing" },
  { keys: "Cmd/Ctrl+A", description: "Select all clips on current track", category: "Editing" },
  { keys: "Cmd/Ctrl+Shift+A", description: "Deselect all", category: "Editing" },
  { keys: "Shift+Click", description: "Add clip to multi-selection", category: "Editing" },
  { keys: "Esc", description: "Deselect / Close dialog", category: "Editing" },

  // Timeline
  { keys: "T", description: "Add text clip", category: "Timeline" },
  { keys: "Cmd/Ctrl+←/→", description: "Nudge selected clip 1 frame", category: "Timeline" },
  { keys: "Cmd/Ctrl+Shift+←/→", description: "Nudge selected clip 1 second", category: "Timeline" },
  { keys: "M", description: "Add marker (toggle mute of audio track)", category: "Timeline" },
  { keys: "+", description: "Zoom in timeline", category: "Timeline" },
  { keys: "-", description: "Zoom out timeline", category: "Timeline" },

  // View
  { keys: "F", description: "Focus preview (toggle fullscreen)", category: "View" },
  { keys: "H", description: "Open User Guide", category: "View" },
  { keys: "F1", description: "Open User Guide", category: "View" },
  { keys: "?", description: "Show keyboard shortcuts list", category: "View" },

  // File
  { keys: "Cmd/Ctrl+E", description: "Open Export dialog", category: "File" },
  { keys: "Cmd/Ctrl+S", description: "Save project (download JSON)", category: "File" },
  { keys: "Cmd/Ctrl+O", description: "Open project (upload JSON)", category: "File" },
];

export const SHORTCUT_CATEGORIES = ["Playback", "Editing", "Timeline", "View", "File"] as const;
