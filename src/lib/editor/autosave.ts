// Autosave manager — debounced localStorage persistence
import { useEditorStore } from "./store";
import type { AnyClip, MediaSource, ProjectSettings, Track } from "./types";

const AUTOSAVE_KEY = "video-editor-studio:autosave";
const AUTOSAVE_INTERVAL_MS = 5000; // 5 seconds
const MAX_AUTOSAVES = 10;

export interface AutosaveSnapshot {
  timestamp: number;
  project: ProjectSettings;
  tracks: Track[];
  // Media library is saved WITHOUT blob URLs (they can't survive reload)
  // User must re-add their own media on reload
  mediaLibraryMeta: Array<{
    id: string;
    kind: string;
    name: string;
    duration?: number;
    width?: number;
    height?: number;
    // For sample/stock assets with stable URLs, keep them
    url?: string;
    isSample?: boolean;
  }>;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSnapshotJson: string = "";
let isAutosaveEnabled = true;

/**
 * Capture the current editor state for autosave.
 * Strips blob: URLs from media library (they won't survive reload).
 */
function captureSnapshot(): AutosaveSnapshot | null {
  const s = useEditorStore.getState();
  // Don't autosave while exporting (could be mid-mutation)
  if (s.isExporting) return null;
  const mediaLibraryMeta = s.mediaLibrary
    .filter((m) => !m.url.startsWith("blob:")) // skip blob URLs
    .map((m) => ({
      id: m.id,
      kind: m.kind,
      name: m.name,
      duration: m.duration,
      width: m.width,
      height: m.height,
      url: m.url,
      isSample: m.isSample,
    }));
  return {
    timestamp: Date.now(),
    project: { ...s.project },
    tracks: JSON.parse(JSON.stringify(s.tracks)) as Track[],
    mediaLibraryMeta,
  };
}

/**
 * Save snapshot to localStorage. Silently fails if quota exceeded.
 */
function saveSnapshot(snapshot: AutosaveSnapshot): boolean {
  try {
    const json = JSON.stringify(snapshot);
    if (json === lastSnapshotJson) return true; // no change
    lastSnapshotJson = json;
    // Rotate old autosaves: keep a small history list
    const historyRaw = localStorage.getItem(`${AUTOSAVE_KEY}:history`);
    const history: AutosaveSnapshot[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(snapshot);
    while (history.length > MAX_AUTOSAVES) history.shift();
    try {
      localStorage.setItem(`${AUTOSAVE_KEY}:history`, JSON.stringify(history));
      localStorage.setItem(AUTOSAVE_KEY, json);
    } catch (e) {
      // Quota exceeded — keep only the latest snapshot
      try {
        localStorage.removeItem(`${AUTOSAVE_KEY}:history`);
        localStorage.setItem(AUTOSAVE_KEY, json);
      } catch {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Start the autosave timer. Call once on mount.
 */
export function startAutosave(): void {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  const tick = () => {
    if (isAutosaveEnabled) {
      const snap = captureSnapshot();
      if (snap) saveSnapshot(snap);
    }
    autosaveTimer = setTimeout(tick, AUTOSAVE_INTERVAL_MS);
  };
  autosaveTimer = setTimeout(tick, AUTOSAVE_INTERVAL_MS);
}

/**
 * Stop autosave. Call on unmount.
 */
export function stopAutosave(): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

/**
 * Force an immediate save (e.g., on tab close).
 */
export function forceSave(): void {
  const snap = captureSnapshot();
  if (snap) saveSnapshot(snap);
}

/**
 * Check if a recoverable autosave exists.
 */
export function hasRecoverableAutosave(): AutosaveSnapshot | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const snap: AutosaveSnapshot = JSON.parse(raw);
    if (!snap.tracks || !snap.project) return null;
    // Only offer recovery if recent (within last 24 hours)
    const ageMs = Date.now() - snap.timestamp;
    if (ageMs > 24 * 60 * 60 * 1000) return null;
    return snap;
  } catch {
    return null;
  }
}

/**
 * Get all autosave history entries (newest last).
 */
export function getAutosaveHistory(): AutosaveSnapshot[] {
  try {
    const raw = localStorage.getItem(`${AUTOSAVE_KEY}:history`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Apply an autosave snapshot to the store.
 */
export function applyAutosaveSnapshot(snap: AutosaveSnapshot): void {
  const store = useEditorStore.getState();
  // Reconstruct media library (only stable URLs survive)
  const mediaLibrary: MediaSource[] = (snap.mediaLibraryMeta || [])
    .filter((m) => m.url) // only keep entries with URLs
    .map((m) => ({
      id: m.id,
      kind: m.kind as any,
      url: m.url!,
      name: m.name,
      duration: m.duration,
      width: m.width,
      height: m.height,
      isSample: m.isSample,
    }));
  // Reset history (don't pollute with autosave state)
  useEditorStore.setState({
    project: snap.project,
    tracks: snap.tracks,
    mediaLibrary,
    history: [],
    historyIndex: -1,
    selectedClipId: null,
    selectedClipIds: [],
    playhead: 0,
    isPlaying: false,
  });
  // Push initial history after applying
  store.pushHistory();
  store.recalculateDuration();
}

/**
 * Clear all autosave data.
 */
export function clearAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
  localStorage.removeItem(`${AUTOSAVE_KEY}:history`);
  lastSnapshotJson = "";
}

/**
 * Temporarily pause autosave (e.g., during an import operation).
 */
export function pauseAutosave(): void {
  isAutosaveEnabled = false;
}

export function resumeAutosave(): void {
  isAutosaveEnabled = true;
}
