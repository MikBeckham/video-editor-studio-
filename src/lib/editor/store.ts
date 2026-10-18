// Zustand store for the editor state
import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  AnyClip,
  AudioClip,
  AspectRatio,
  ExportSettings,
  FrameRate,
  ImageClip,
  MediaSource,
  ProjectSettings,
  StickerClip,
  TextClip,
  TextStyleProps,
  ThemeMode,
  Track,
  TrackKind,
  TransitionConfig,
  VideoClip,
  FilterAdjustments,
  FilterKind,
} from "./types";
import {
  ASPECT_RATIOS,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_TEXT_STYLE,
} from "./constants";

interface EditorState {
  project: ProjectSettings;
  tracks: Track[];
  mediaLibrary: MediaSource[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  playhead: number;
  isPlaying: boolean;
  duration: number;
  zoom: number; // px per second
  exportSettings: ExportSettings;
  isExporting: boolean;
  exportProgress: number;
  // clipboard & history
  clipboard: AnyClip | null;
  history: { tracks: Track[] }[];
  historyIndex: number;
  // actions
  setTheme: (t: ThemeMode) => void;
  setAspectRatio: (a: AspectRatio) => void;
  setFps: (f: FrameRate) => void;
  setProjectName: (n: string) => void;
  setPlayhead: (t: number) => void;
  setIsPlaying: (p: boolean) => void;
  setZoom: (z: number) => void;
  addMedia: (m: MediaSource) => void;
  removeMedia: (id: string) => void;
  addTrack: (kind: TrackKind) => void;
  removeTrack: (id: string) => void;
  toggleTrackMute: (id: string) => void;
  toggleTrackLock: (id: string) => void;
  toggleTrackHidden: (id: string) => void;
  selectClip: (id: string | null) => void;
  selectTrack: (id: string | null) => void;
  addClip: (clip: AnyClip) => void;
  updateClip: (id: string, patch: Partial<AnyClip>) => void;
  removeClip: (id: string) => void;
  splitClip: (id: string, at: number) => void;
  moveClip: (id: string, newStart: number, newTrackId?: string) => void;
  trimClip: (id: string, newStart: number, newEnd: number) => void;
  reorderTracks: (fromId: string, toId: string) => void;
  recalculateDuration: () => void;
  setExportSettings: (s: Partial<ExportSettings>) => void;
  setExportProgress: (p: number) => void;
  setIsExporting: (v: boolean) => void;
  // clipboard / history actions
  copyClip: () => void;
  pasteClip: () => void;
  duplicateClip: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;
  // multi-select
  selectedClipIds: string[];
  selectClips: (ids: string[], additive?: boolean) => void;
  toggleClipSelection: (id: string) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  // timeline helpers
  rippleDelete: (id: string) => void;
  nudgeClip: (id: string, dx: number) => void;
  getSnapTargets: (excludeClipId?: string) => number[];
  // factory helpers
  createVideoClip: (source: MediaSource, trackId: string, start: number) => VideoClip;
  createImageClip: (source: MediaSource, trackId: string, start: number) => VideoClip;
  createAudioClip: (source: MediaSource, trackId: string, start: number) => AudioClip;
  createTextClip: (text: string, style: Partial<TextStyleProps>, trackId: string, start: number) => TextClip;
  createStickerClip: (emoji: string, trackId: string, start: number) => StickerClip;
  findClip: (id: string | null) => AnyClip | undefined;
  findTrack: (id: string | null) => Track | undefined;
  loadSampleProject: () => void;
}

const defaultProject: ProjectSettings = {
  name: "My Video Project",
  aspectRatio: "16:9",
  fps: 30,
  width: 1920,
  height: 1080,
  backgroundColor: "#000000",
  theme: "studio",
};

const defaultExportSettings: ExportSettings = {
  format: "mp4",
  method: "mediarecorder",
  quality: "high",
  fps: 30,
  aspectRatio: "16:9",
  width: 1920,
  height: 1080,
};

function makeTrack(kind: TrackKind, name: string): Track {
  return { id: nanoid(), kind, name, clips: [] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: defaultProject,
  tracks: [
    makeTrack("video", "Video Track 1"),
    makeTrack("text", "Text Track"),
    makeTrack("audio", "Audio Track"),
    makeTrack("sticker", "Sticker Track"),
  ],
  mediaLibrary: [],
  selectedClipId: null,
  selectedTrackId: null,
  playhead: 0,
  isPlaying: false,
  duration: 0,
  zoom: 60,
  exportSettings: defaultExportSettings,
  isExporting: false,
  exportProgress: 0,
  clipboard: null,
  history: [],
  historyIndex: -1,
  selectedClipIds: [],

  setTheme: (t) =>
    set((s) => ({ project: { ...s.project, theme: t } })),

  setAspectRatio: (a) => {
    const ar = ASPECT_RATIOS.find((r) => r.value === a);
    if (!ar) return;
    set((s) => ({
      project: { ...s.project, aspectRatio: a as AspectRatio, width: ar.w, height: ar.h },
    }));
  },

  setFps: (f) =>
    set((s) => ({ project: { ...s.project, fps: f } })),

  setProjectName: (n) =>
    set((s) => ({ project: { ...s.project, name: n } })),

  setPlayhead: (t) => set({ playhead: Math.max(0, t) }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  setZoom: (z) => set({ zoom: Math.max(10, Math.min(400, z)) }),

  addMedia: (m) => set((s) => ({ mediaLibrary: [...s.mediaLibrary, m] })),
  removeMedia: (id) =>
    set((s) => ({ mediaLibrary: s.mediaLibrary.filter((m) => m.id !== id) })),

  addTrack: (kind) =>
    set((s) => ({
      tracks: [
        ...s.tracks,
        makeTrack(kind, `${kind[0].toUpperCase()}${kind.slice(1)} Track ${s.tracks.filter(t => t.kind === kind).length + 1}`),
      ],
    })),

  removeTrack: (id) =>
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== id),
    })),

  toggleTrackMute: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)),
    })),
  toggleTrackLock: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t)),
    })),
  toggleTrackHidden: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, hidden: !t.hidden } : t)),
    })),

  selectClip: (id) => set({
    selectedClipId: id,
    selectedClipIds: id ? [id] : [],
  }),
  selectTrack: (id) => set({ selectedTrackId: id }),

  pushHistory: () => {
    // Capture CURRENT state and append to history.
    // Pattern: the CURRENT state is always at history[historyIndex].
    // After a state change, call pushHistory() to capture the NEW state.
    // Undo decrements index (restores previous snapshot).
    // Redo increments index (restores next snapshot).
    set((s) => {
      const snapshot = { tracks: JSON.parse(JSON.stringify(s.tracks)) };
      // truncate any future history if we're not at the end
      const history = s.history.slice(0, s.historyIndex + 1);
      history.push(snapshot);
      // cap history to last 50 entries
      while (history.length > 50) {
        history.shift();
      }
      return { history, historyIndex: history.length - 1 };
    });
  },

  canUndo: () => {
    const s = get();
    return s.historyIndex > 0;
  },
  canRedo: () => {
    const s = get();
    return s.historyIndex < s.history.length - 1;
  },

  undo: () => {
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const idx = s.historyIndex - 1;
      const snapshot = s.history[idx];
      if (!snapshot) return s;
      return {
        tracks: JSON.parse(JSON.stringify(snapshot.tracks)),
        historyIndex: idx,
      };
    });
    get().recalculateDuration();
  },

  redo: () => {
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const idx = s.historyIndex + 1;
      const snapshot = s.history[idx];
      if (!snapshot) return s;
      return {
        tracks: JSON.parse(JSON.stringify(snapshot.tracks)),
        historyIndex: idx,
      };
    });
    get().recalculateDuration();
  },

  addClip: (clip) => {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === clip.trackId ? { ...t, clips: [...t.clips, clip] } : t
      ),
    }));
    get().selectClip(clip.id);
    get().pushHistory();
    get().recalculateDuration();
  },

  updateClip: (id, patch) =>
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === id ? ({ ...c, ...patch } as AnyClip) : c)),
      })),
    })),

  removeClip: (id) => {
    // Honor track locking
    const s0 = get();
    const track = s0.tracks.find((t) => t.clips.some((c) => c.id === id));
    if (track?.locked) {
      return; // locked: no-op
    }
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== id),
      })),
      selectedClipId: s.selectedClipId === id ? null : s.selectedClipId,
      selectedClipIds: s.selectedClipIds.filter((x) => x !== id),
    }));
    get().pushHistory();
    get().recalculateDuration();
  },

  splitClip: (id, at) => {
    const s = get();
    let targetTrack: Track | undefined;
    let targetClip: AnyClip | undefined;
    for (const t of s.tracks) {
      const c = t.clips.find((c) => c.id === id);
      if (c) { targetTrack = t; targetClip = c; break; }
    }
    if (!targetTrack || !targetClip) return;
    if (targetTrack.locked) return; // locked: no-op
    if (at <= targetClip.start + 0.1 || at >= targetClip.end - 0.1) return;
    const newClip = {
      ...targetClip,
      id: nanoid(),
      start: at,
      end: targetClip.end,
    } as AnyClip;
    const updated = { ...targetClip, end: at } as AnyClip;
    set((st) => ({
      tracks: st.tracks.map((t) =>
        t.id === targetTrack!.id
          ? {
              ...t,
              clips: [
                ...t.clips.filter((c) => c.id !== id),
                updated,
                newClip,
              ],
            }
          : t
      ),
    }));
    get().pushHistory();
    get().recalculateDuration();
  },

  moveClip: (id, newStart, newTrackId) => {
    const s = get();
    let clip: AnyClip | undefined;
    let oldTrackId = "";
    for (const t of s.tracks) {
      const c = t.clips.find((c) => c.id === id);
      if (c) { clip = c; oldTrackId = t.id; break; }
    }
    if (!clip) return;
    // Honor track locking on both source and target
    const oldTrack = s.tracks.find((t) => t.id === oldTrackId);
    const newTrack = s.tracks.find((t) => t.id === (newTrackId ?? oldTrackId));
    if (oldTrack?.locked) return;
    if (newTrack?.locked) return;
    const dur = clip.end - clip.start;
    const newEnd = newStart + dur;
    const targetTrackId = newTrackId || oldTrackId;
    // Skip if no actual change
    if (clip.start === newStart && oldTrackId === targetTrackId) return;
    set((st) => ({
      tracks: st.tracks.map((t) => {
        if (t.id === oldTrackId && t.id !== targetTrackId) {
          return { ...t, clips: t.clips.filter((c) => c.id !== id) };
        }
        if (t.id === targetTrackId) {
          if (t.id !== oldTrackId) {
            return { ...t, clips: [...t.clips, { ...clip!, trackId: targetTrackId, start: newStart, end: newEnd } as AnyClip] };
          } else {
            return { ...t, clips: t.clips.map((c) => c.id === id ? { ...c, start: newStart, end: newEnd } as AnyClip : c) };
          }
        }
        return t;
      }),
    }));
    get().recalculateDuration();
  },

  trimClip: (id, newStart, newEnd) => {
    // Honor track locking
    const s0 = get();
    const tr = s0.tracks.find((t) => t.clips.some((c) => c.id === id));
    if (tr?.locked) return;
    set((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === id ? { ...c, start: newStart, end: newEnd } as AnyClip : c
        ),
      })),
    }));
    get().recalculateDuration();
  },

  reorderTracks: (fromId, toId) => {
    set((s) => {
      const from = s.tracks.findIndex((t) => t.id === fromId);
      const to = s.tracks.findIndex((t) => t.id === toId);
      if (from === -1 || to === -1 || from === to) return s;
      const tracks = [...s.tracks];
      const [m] = tracks.splice(from, 1);
      tracks.splice(to, 0, m);
      return { tracks };
    });
    get().pushHistory();
  },

  recalculateDuration: () =>
    set((s) => {
      let max = 0;
      for (const t of s.tracks) {
        for (const c of t.clips) {
          if (c.end > max) max = c.end;
        }
      }
      return { duration: max };
    }),

  setExportSettings: (patch) =>
    set((s) => ({ exportSettings: { ...s.exportSettings, ...patch } })),
  setExportProgress: (p) => set({ exportProgress: p }),
  setIsExporting: (v) => set({ isExporting: v }),

  // Multi-select helpers
  selectClips: (ids, additive) =>
    set((s) => ({
      selectedClipIds: additive ? Array.from(new Set([...s.selectedClipIds, ...ids])) : ids,
      selectedClipId: ids[0] ?? null,
    })),

  toggleClipSelection: (id) =>
    set((s) => {
      const has = s.selectedClipIds.includes(id);
      const next = has ? s.selectedClipIds.filter((x) => x !== id) : [...s.selectedClipIds, id];
      return {
        selectedClipIds: next,
        selectedClipId: next[next.length - 1] ?? null,
      };
    }),

  clearSelection: () => set({ selectedClipIds: [], selectedClipId: null }),

  deleteSelected: () => {
    const s = get();
    if (s.selectedClipIds.length === 0) return;
    const ids = new Set(s.selectedClipIds);
    set((st) => ({
      tracks: st.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => !ids.has(c.id)),
      })),
      selectedClipIds: [],
      selectedClipId: null,
    }));
    get().pushHistory();
    get().recalculateDuration();
  },

  rippleDelete: (id) => {
    const s = get();
    let targetTrack: Track | undefined;
    let clip: AnyClip | undefined;
    for (const t of s.tracks) {
      const c = t.clips.find((c) => c.id === id);
      if (c) { targetTrack = t; clip = c; break; }
    }
    if (!targetTrack || !clip) return;
    if (targetTrack.locked) return;
    const duration = clip.end - clip.start;
    set((st) => ({
      tracks: st.tracks.map((t) => {
        if (t.id !== targetTrack!.id) return t;
        const remaining = t.clips.filter((c) => c.id !== id);
        // shift later clips left by `duration`
        return {
          ...t,
          clips: remaining.map((c) =>
            c.start >= clip!.end ? { ...c, start: c.start - duration, end: c.end - duration } as AnyClip : c
          ),
        };
      }),
      selectedClipId: null,
      selectedClipIds: [],
    }));
    get().pushHistory();
    get().recalculateDuration();
  },

  nudgeClip: (id, dx) => {
    const s = get();
    let clip: AnyClip | undefined;
    for (const t of s.tracks) {
      const c = t.clips.find((c) => c.id === id);
      if (c) { clip = c; break; }
    }
    if (!clip) return;
    const newStart = Math.max(0, clip.start + dx);
    get().moveClip(id, newStart);
  },

  getSnapTargets: (excludeClipId) => {
    const s = get();
    const targets: number[] = [0, s.playhead];
    // Time grid (every 1 second up to duration + 5)
    const maxT = Math.max(s.duration + 5, 30);
    for (let i = 0; i <= maxT; i++) targets.push(i);
    // Clip edges
    for (const t of s.tracks) {
      for (const c of t.clips) {
        if (excludeClipId && c.id === excludeClipId) continue;
        targets.push(c.start, c.end);
      }
    }
    return targets;
  },

  copyClip: () => {
    const s = get();
    if (!s.selectedClipId) return;
    const clip = s.findClip(s.selectedClipId);
    if (!clip) return;
    set({ clipboard: JSON.parse(JSON.stringify(clip)) });
  },

  pasteClip: () => {
    const s = get();
    if (!s.clipboard) return;
    const orig = s.clipboard;
    // Find target track - same kind as clipboard clip
    let targetTrack = s.tracks.find((t) => t.kind === orig.kind);
    if (!targetTrack) targetTrack = s.tracks[0];
    if (!targetTrack) return;
    const dur = orig.end - orig.start;
    const newClip = {
      ...JSON.parse(JSON.stringify(orig)),
      id: nanoid(),
      trackId: targetTrack.id,
      start: s.playhead,
      end: s.playhead + dur,
      keyframes: (orig.keyframes ?? []).map((k: any) => ({ ...k, id: nanoid() })),
    } as AnyClip;
    set((st) => ({
      tracks: st.tracks.map((t) =>
        t.id === targetTrack!.id ? { ...t, clips: [...t.clips, newClip] } : t
      ),
    }));
    get().selectClip(newClip.id);
    get().pushHistory();
    get().recalculateDuration();
  },

  duplicateClip: () => {
    const s = get();
    if (!s.selectedClipId) return;
    const orig = s.findClip(s.selectedClipId);
    if (!orig) return;
    const dur = orig.end - orig.start;
    const newClip = {
      ...JSON.parse(JSON.stringify(orig)),
      id: nanoid(),
      start: orig.end + 0.05,
      end: orig.end + 0.05 + dur,
      keyframes: (orig.keyframes ?? []).map((k: any) => ({ ...k, id: nanoid() })),
    } as AnyClip;
    set((st) => ({
      tracks: st.tracks.map((t) =>
        t.id === orig.trackId ? { ...t, clips: [...t.clips, newClip] } : t
      ),
    }));
    get().selectClip(newClip.id);
    get().pushHistory();
    get().recalculateDuration();
  },

  createVideoClip: (source, trackId, start) => {
    const dur = source.duration ?? 5;
    return {
      id: nanoid(),
      trackId,
      kind: "video" as const,
      sourceId: source.id,
      start,
      end: start + dur,
      sourceStart: 0,
      sourceEnd: dur,
      name: source.name,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      entrance: "fadeIn" as const,
      exit: "fadeOut" as const,
      continuous: "none" as const,
      keyframes: [],
      filters: "none" as FilterKind,
      adjustments: { ...DEFAULT_ADJUSTMENTS } as FilterAdjustments,
      speed: 1,
      volume: 1,
      reverse: false,
      flipH: false,
      flipV: false,
    } as VideoClip;
  },

  createImageClip: (source, trackId, start) => {
    return {
      id: nanoid(),
      trackId,
      kind: "video" as const,
      sourceId: source.id,
      start,
      end: start + 5,
      sourceStart: 0,
      sourceEnd: 5,
      name: source.name,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      entrance: "fadeIn" as const,
      exit: "none" as const,
      continuous: "none" as const,
      keyframes: [],
      filters: "none" as FilterKind,
      adjustments: { ...DEFAULT_ADJUSTMENTS } as FilterAdjustments,
      speed: 1,
      volume: 0,
      reverse: false,
      flipH: false,
      flipV: false,
      isImage: true,
    } as VideoClip;
  },

  createAudioClip: (source, trackId, start) => {
    const dur = source.duration ?? 10;
    return {
      id: nanoid(),
      trackId,
      kind: "audio" as const,
      sourceId: source.id,
      start,
      end: start + dur,
      sourceStart: 0,
      sourceEnd: dur,
      name: source.name,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      entrance: "none" as const,
      exit: "none" as const,
      continuous: "none" as const,
      keyframes: [],
      volume: 1,
      fadeIn: 0.5,
      fadeOut: 0.5,
      speed: 1,
    } as AudioClip;
  },

  createTextClip: (text, style, trackId, start) => ({
    id: nanoid(),
    trackId,
    kind: "text" as const,
    text,
    start,
    end: start + 5,
    name: text.slice(0, 24),
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
    entrance: "fadeIn" as const,
    exit: "fadeOut" as const,
    continuous: "none" as const,
    keyframes: [],
    style: { ...DEFAULT_TEXT_STYLE, ...style } as TextStyleProps,
  } as TextClip),

  createStickerClip: (emoji, trackId, start) => ({
    id: nanoid(),
    trackId,
    kind: "sticker" as const,
    emoji,
    size: 120,
    start,
    end: start + 3,
    name: emoji,
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
    entrance: "popIn" as const,
    exit: "popOut" as const,
    continuous: "float" as const,
    keyframes: [],
  } as StickerClip),

  findClip: (id) => {
    if (!id) return undefined;
    const s = get();
    for (const t of s.tracks) {
      const c = t.clips.find((c) => c.id === id);
      if (c) return c;
    }
    return undefined;
  },

  findTrack: (id) => {
    if (!id) return undefined;
    const s = get();
    return s.tracks.find((t) => t.id === id);
  },

  loadSampleProject: () => {
    // create sample text clips & stickers as a demo
    const s = get();
    const textTrack = s.tracks.find((t) => t.kind === "text");
    const stickerTrack = s.tracks.find((t) => t.kind === "sticker");
    const newClips: AnyClip[] = [];
    if (textTrack) {
      newClips.push({
        id: nanoid(),
        trackId: textTrack.id,
        kind: "text",
        text: "My Awesome Video",
        start: 0,
        end: 4,
        name: "Title",
        x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1,
        entrance: "popIn",
        exit: "fadeOut",
        continuous: "none",
        keyframes: [],
        style: { ...DEFAULT_TEXT_STYLE, preset: "holiday", fontSize: 90, color: "#FFD700", strokeColor: "#0a1931", strokeWidth: 4, shadow: true, fontWeight: 800 },
      } as TextClip);
      newClips.push({
        id: nanoid(),
        trackId: textTrack.id,
        kind: "text",
        text: "Let's Edit!",
        start: 4,
        end: 8,
        name: "Subtitle",
        x: 0.5, y: 0.7, scale: 1, rotation: 0, opacity: 1,
        entrance: "slideInUp",
        exit: "slideInDown",
        continuous: "pulse",
        keyframes: [],
        style: { ...DEFAULT_TEXT_STYLE, preset: "neon", fontSize: 64, color: "#00FFE0", shadowColor: "#00FFE0", shadow: true },
      } as TextClip);
    }
    if (stickerTrack) {
      newClips.push({
        id: nanoid(),
        trackId: stickerTrack.id,
        kind: "sticker",
        emoji: "🎉",
        size: 140,
        start: 1,
        end: 4,
        name: "Party",
        x: 0.2, y: 0.25, scale: 1, rotation: 0, opacity: 1,
        entrance: "popIn",
        exit: "popOut",
        continuous: "bounce",
        keyframes: [],
      } as StickerClip);
    }
    set((st) => ({
      tracks: st.tracks.map((t) => ({
        ...t,
        clips: [...t.clips, ...newClips.filter(c => c.trackId === t.id)],
      })),
      duration: 8,
    }));
    get().pushHistory();
    get().recalculateDuration();
  },
}));
