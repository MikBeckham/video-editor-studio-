'use client';
// Multi-track timeline with drag-drop, trim, split, transitions
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";
import type { AnyClip, MediaSource, Track, TrackKind } from "@/lib/editor/types";
import {
  Video,
  Music2,
  Type as TypeIcon,
  Sticker,
  Trash2,
  Scissors,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import Waveform from "./waveform";

const TRACK_KIND_ICON: Record<TrackKind, React.ComponentType<{ className?: string }>> = {
  video: Video,
  audio: Music2,
  text: TypeIcon,
  sticker: Sticker,
};

const TRACK_KIND_COLOR: Record<TrackKind, string> = {
  video: "bg-sky-500/20 border-sky-400/40",
  audio: "bg-emerald-500/20 border-emerald-400/40",
  text: "bg-amber-500/20 border-amber-400/40",
  sticker: "bg-pink-500/20 border-pink-400/40",
};

const TRACK_KIND_BAR: Record<TrackKind, string> = {
  video: "bg-sky-400/40 hover:bg-sky-400/60 border-sky-300",
  audio: "bg-emerald-400/40 hover:bg-emerald-400/60 border-emerald-300",
  text: "bg-amber-400/40 hover:bg-amber-400/60 border-amber-300",
  sticker: "bg-pink-400/40 hover:bg-pink-400/60 border-pink-300",
};

const TRACK_HEIGHT = 56;
const RULER_HEIGHT = 28;
const LABEL_WIDTH = 168;

export default function TimelinePanel() {
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const selectClip = useEditorStore((s) => s.selectClip);
  const selectClips = useEditorStore((s) => s.selectClips);
  const toggleClipSelection = useEditorStore((s) => s.toggleClipSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectedClipIds = useEditorStore((s) => s.selectedClipIds);
  const splitClip = useEditorStore((s) => s.splitClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const nudgeClip = useEditorStore((s) => s.nudgeClip);
  const removeTrack = useEditorStore((s) => s.removeTrack);
  const toggleTrackMute = useEditorStore((s) => s.toggleTrackMute);
  const toggleTrackLock = useEditorStore((s) => s.toggleTrackLock);
  const toggleTrackHidden = useEditorStore((s) => s.toggleTrackHidden);
  const addTrack = useEditorStore((s) => s.addTrack);
  const moveClip = useEditorStore((s) => s.moveClip);
  const library = useEditorStore((s) => s.mediaLibrary);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    clipId: string;
    trackId: string;
    startX: number;
    startClipStart: number;
    mode: "move" | "trim-left" | "trim-right";
    targetTrackId?: string;
  } | null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);
  const [snapLine, setSnapLine] = useState<number | null>(null);

  const totalDur = Math.max(duration, 30);
  const contentWidth = totalDur * zoom + 100;

  // Drag handling with smart snapping
  useEffect(() => {
    if (!dragState) return;
    const SNAP_THRESHOLD = 0.25; // seconds
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      const dt = dx / zoom;
      const store = useEditorStore.getState();
      const clip = store.findClip(dragState.clipId);
      if (!clip) return;
      if (dragState.mode === "move") {
        let newStart = Math.max(0, dragState.startClipStart + dt);
        const targetTrackId = dragState.targetTrackId!;
        const clipDur = clip.end - clip.start;
        // Gather snap targets: playhead, clip edges, 1s grid (up to duration+5)
        const targets = store.getSnapTargets(dragState.clipId);
        // Candidate points: clip's newStart, clip's newEnd
        let bestSnap: number | null = null;
        let bestDist = SNAP_THRESHOLD;
        for (const target of targets) {
          // distance to start
          const dStart = Math.abs(newStart - target);
          if (dStart < bestDist) {
            bestDist = dStart;
            bestSnap = target;
          }
          // distance to end
          const newEnd = newStart + clipDur;
          const dEnd = Math.abs(newEnd - target);
          if (dEnd < bestDist) {
            bestDist = dEnd;
            bestSnap = target - clipDur; // so end aligns
          }
        }
        if (bestSnap !== null) {
          newStart = Math.max(0, bestSnap);
          setSnapLine(newStart);
        } else {
          setSnapLine(null);
        }
        moveClip(dragState.clipId, newStart, targetTrackId);
      } else if (dragState.mode === "trim-left") {
        let newStart = Math.max(0, dragState.startClipStart + dt);
        if (newStart < clip.end - 0.1) {
          // Snap to playhead and other clip edges
          const targets = store.getSnapTargets(dragState.clipId);
          for (const target of targets) {
            if (Math.abs(newStart - target) < SNAP_THRESHOLD) {
              newStart = target;
              break;
            }
          }
          store.trimClip(dragState.clipId, newStart, clip.end);
          setSnapLine(newStart);
        } else {
          setSnapLine(null);
        }
      } else if (dragState.mode === "trim-right") {
        let newEnd = Math.max(clip.start + 0.1, clip.end + dt);
        // Snap
        const targets = store.getSnapTargets(dragState.clipId);
        for (const target of targets) {
          if (Math.abs(newEnd - target) < SNAP_THRESHOLD) {
            newEnd = target;
            break;
          }
        }
        store.trimClip(dragState.clipId, clip.start, newEnd);
        setSnapLine(newEnd);
      }
    };
    const onUp = () => {
      // Capture the post-drag state as one undoable step
      useEditorStore.getState().pushHistory();
      setDragState(null);
      setSnapLine(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, zoom, moveClip]);

  const handleClipMouseDown = (e: React.MouseEvent, clip: AnyClip, mode: "move" | "trim-left" | "trim-right") => {
    e.stopPropagation();
    // Honor track locking — don't allow drag on locked tracks
    const track = useEditorStore.getState().tracks.find((t) => t.id === clip.trackId);
    if (track?.locked) return;
    // Single-click selects; Shift+click handled in onClick for clarity
    if (!e.shiftKey && !selectedClipIds.includes(clip.id)) {
      selectClip(clip.id);
    }
    setDragState({
      clipId: clip.id,
      trackId: clip.trackId,
      startX: e.clientX,
      startClipStart: clip.start,
      mode,
      targetTrackId: clip.trackId,
    });
  };

  const handleSelectClip = (id: string, additive: boolean) => {
    if (!id) {
      clearSelection();
      return;
    }
    if (additive) {
      toggleClipSelection(id);
    } else {
      selectClip(id);
    }
  };

  const handleTrackAreaDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrackId(null);
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
    const rect = scrollRef.current?.getBoundingClientRect();
    const labelOffset = LABEL_WIDTH;
    const x = e.clientX - (rect?.left ?? 0) - labelOffset + scrollLeft;
    const dt = Math.max(0, x / zoom);
    let parsed: { kind: string; payload: any; fallback?: any };
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    const store = useEditorStore.getState();
    const start = Math.max(0, dt);
    const track = store.findTrack(trackId);
    if (!track) return;

    if (parsed.kind === "media") {
      let src = store.mediaLibrary.find((m) => m.id === parsed.payload);
      // If not in library yet (e.g., sample dragged directly), add it first
      if (!src && parsed.fallback) {
        const fb = parsed.fallback;
        src = {
          ...fb,
          id: nanoid(),
        };
        store.addMedia(src);
      }
      if (!src) {
        toast.error("Media not found");
        return;
      }
      if (src.kind === "video") {
        // Audio clip dropped on non-audio track: reject
        const clip = store.createVideoClip(src, trackId, start);
        store.addClip(clip);
      } else if (src.kind === "image") {
        const clip = store.createImageClip(src, trackId, start);
        store.addClip(clip);
      } else if (src.kind === "audio") {
        if (track.kind !== "audio") {
          toast.error("Audio can only be dropped on audio track");
          return;
        }
        const clip = store.createAudioClip(src, trackId, start);
        store.addClip(clip);
      }
      toast.success(`${src.name} added`);
    } else if (parsed.kind === "text") {
      // For text clip, only allow on text track
      if (track.kind !== "text") {
        toast.error("Text can only be dropped on text track");
        return;
      }
      const { text, style } = parsed.payload as { text: string; style: any };
      const clip = store.createTextClip(text || "Text", style, trackId, start);
      store.addClip(clip);
      toast.success("Text added");
    } else if (parsed.kind === "sticker") {
      if (track.kind !== "sticker") {
        toast.error("Sticker can only be dropped on sticker track");
        return;
      }
      const clip = store.createStickerClip(parsed.payload, trackId, start);
      store.addClip(clip);
      toast.success("Sticker added");
    }
  };

  const handleRulerClick = (e: React.MouseEvent) => {
    const x = e.clientX - (scrollRef.current?.getBoundingClientRect().left ?? 0) - LABEL_WIDTH + (scrollRef.current?.scrollLeft ?? 0);
    const t = Math.max(0, x / zoom);
    setPlayhead(t);
    setIsPlaying(false);
  };

  // Auto-scroll when playing
  useEffect(() => {
    if (!scrollRef.current) return;
    const playheadX = playhead * zoom;
    const view = scrollRef.current;
    if (playheadX < view.scrollLeft + 50 || playheadX > view.scrollLeft + view.clientWidth - LABEL_WIDTH - 50) {
      view.scrollLeft = Math.max(0, playheadX - view.clientWidth / 2 + LABEL_WIDTH / 2);
    }
  }, [playhead, zoom]);

  return (
    <div className="flex flex-col h-full bg-card/30 border-t border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/40">
        <span className="text-sm font-semibold">Timeline</span>
        <span className="text-xs text-muted-foreground">· {tracks.length} tracks</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectedClipId && splitClip(selectedClipId, playhead)}
          disabled={!selectedClipId}
          className="gap-1 h-7"
          title="Split clip at playhead (S)"
        >
          <Scissors className="w-3.5 h-3.5" /> Split <kbd className="ml-1 text-[9px] font-mono bg-muted px-1 py-0.5 rounded">S</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedClipIds.length > 1) {
              deleteSelected();
            } else if (selectedClipId) {
              removeClip(selectedClipId);
            }
          }}
          disabled={!selectedClipId}
          className="gap-1 h-7 text-destructive hover:text-destructive"
          title="Delete selected clip(s) (Del) — Shift+Del for ripple delete"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete <kbd className="ml-1 text-[9px] font-mono bg-muted px-1 py-0.5 rounded">Del</kbd>
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={() => setZoom(zoom * 0.8)} className="h-7 w-7 p-0" title="Zoom out (-)">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setZoom(zoom * 1.25)} className="h-7 w-7 p-0" title="Zoom in (+)">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Ruler */}
        <div className="flex border-b border-border bg-card/20" style={{ height: RULER_HEIGHT }}>
          <div style={{ width: LABEL_WIDTH }} className="border-r border-border flex items-center px-3">
            <span className="text-[10px] uppercase text-muted-foreground tracking-wide">Tracks</span>
          </div>
          <div
            className="flex-1 relative cursor-pointer"
            onMouseDown={handleRulerClick}
            style={{ width: contentWidth }}
          >
            {Array.from({ length: Math.ceil(totalDur) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-border/40 text-[10px] text-muted-foreground/70"
                style={{ left: i * zoom }}
              >
                <span className="ml-1">{i}s</span>
              </div>
            ))}
            {/* Playhead marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
              style={{ left: playhead * zoom }}
            />
            <div
              className="absolute top-0 w-3 h-3 -ml-1.5 bg-red-500 z-10 pointer-events-none rounded-b-sm"
              style={{ left: playhead * zoom }}
            />
            {/* Snap guide line (visible during drag) */}
            {snapLine !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none opacity-70"
                style={{ left: snapLine * zoom }}
              />
            )}
          </div>
        </div>

        {/* Tracks list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
        >
          <div style={{ width: LABEL_WIDTH + contentWidth, minHeight: tracks.length * TRACK_HEIGHT + 20 }}>
            {tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                zoom={zoom}
                contentWidth={contentWidth}
                selectedClipId={selectedClipId}
                selectedClipIds={selectedClipIds}
                library={library}
                onSelectClip={handleSelectClip}
                onClipMouseDown={handleClipMouseDown}
                onTrackDrop={handleTrackAreaDrop}
                onToggleMute={() => toggleTrackMute(track.id)}
                onToggleLock={() => toggleTrackLock(track.id)}
                onToggleHidden={() => toggleTrackHidden(track.id)}
                onRemoveTrack={() => removeTrack(track.id)}
                isDragOver={dragOverTrackId === track.id}
                onDragEnter={() => setDragOverTrackId(track.id)}
                onDragLeave={() => setDragOverTrackId((cur) => (cur === track.id ? null : cur))}
              />
            ))}
            {/* Add track buttons */}
            <div className="flex items-center gap-2 px-3 py-2" style={{ marginLeft: 0 }}>
              {(["video", "audio", "text", "sticker"] as TrackKind[]).map((k) => (
                <Button
                  key={k}
                  variant="outline"
                  size="sm"
                  onClick={() => addTrack(k)}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" /> {k}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimelineTrackProps {
  track: Track;
  zoom: number;
  contentWidth: number;
  selectedClipId: string | null;
  selectedClipIds: string[];
  library: MediaSource[];
  onSelectClip: (id: string, additive: boolean) => void;
  onClipMouseDown: (e: React.MouseEvent, clip: AnyClip, mode: "move" | "trim-left" | "trim-right") => void;
  onTrackDrop: (e: React.DragEvent, trackId: string) => void;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleHidden: () => void;
  onRemoveTrack: () => void;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
}

function TimelineTrack({
  track, zoom, contentWidth, selectedClipId, selectedClipIds, library, onSelectClip, onClipMouseDown, onTrackDrop,
  onToggleMute, onToggleLock, onToggleHidden, onRemoveTrack, isDragOver, onDragEnter, onDragLeave,
}: TimelineTrackProps) {
  const Icon = TRACK_KIND_ICON[track.kind];
  return (
    <div
      className={cn("flex border-b border-border/40 transition-colors", isDragOver && "bg-primary/10")}
      style={{ height: TRACK_HEIGHT }}
    >
      {/* Track header */}
      <div
        className={cn(
          "border-r border-border flex items-center px-2 gap-1.5 text-xs",
          track.hidden && "opacity-50"
        )}
        style={{ width: LABEL_WIDTH, background: "var(--background)" }}
      >
        <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1 text-[11px]">{track.name}</span>
        <button
          onClick={onToggleHidden}
          className="opacity-60 hover:opacity-100"
          title={track.hidden ? "Show" : "Hide"}
          aria-label={track.hidden ? "Show track" : "Hide track"}
        >
          {track.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
        {track.kind === "audio" && (
          <button
            onClick={onToggleMute}
            className="opacity-60 hover:opacity-100"
            title={track.muted ? "Unmute" : "Mute"}
            aria-label={track.muted ? "Unmute track" : "Mute track"}
          >
            {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
        )}
        <button
          onClick={onToggleLock}
          className="opacity-60 hover:opacity-100"
          title={track.locked ? "Unlock" : "Lock"}
          aria-label={track.locked ? "Unlock track" : "Lock track"}
        >
          {track.locked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
        </button>
        <button
          onClick={onRemoveTrack}
          className="opacity-60 hover:opacity-100 hover:text-destructive"
          title="Remove track"
          aria-label="Remove track"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Track clips area */}
      <div
        className={cn("relative flex-1", isDragOver && "ring-2 ring-primary/60 ring-inset")}
        style={{ width: contentWidth, background: "var(--background)" }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragOver) onDragEnter(); }}
        onDragLeave={(e) => { e.stopPropagation(); onDragLeave(); }}
        onDrop={(e) => onTrackDrop(e, track.id)}
        onMouseDown={(e) => {
          // Click empty area deselects
          if (e.target === e.currentTarget) {
            onSelectClip("", false);
          }
        }}
      >
        {track.clips.map((clip) => (
          <ClipBar
            key={clip.id}
            clip={clip}
            track={track}
            zoom={zoom}
            selected={selectedClipId === clip.id}
            multiselected={selectedClipIds.includes(clip.id) && selectedClipId !== clip.id}
            onMouseDown={onClipMouseDown}
            onSelect={onSelectClip}
            library={library}
          />
        ))}
        {/* Drag-over hint */}
        {isDragOver && (
          <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-md flex items-center justify-center pointer-events-none bg-primary/5">
            <span className="text-xs text-primary font-medium">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ClipBarProps {
  clip: AnyClip;
  track: Track;
  zoom: number;
  selected: boolean;
  multiselected: boolean;
  onMouseDown: (e: React.MouseEvent, clip: AnyClip, mode: "move" | "trim-left" | "trim-right") => void;
  onSelect: (id: string, additive: boolean) => void;
  library: MediaSource[];
}

function ClipBar({ clip, track, zoom, selected, multiselected, onMouseDown, onSelect, library }: ClipBarProps) {
  const left = clip.start * zoom;
  const width = (clip.end - clip.start) * zoom;
  const color = TRACK_KIND_BAR[track.kind];
  const label = clip.kind === "text" ? (clip as any).text ?? clip.name
    : clip.kind === "sticker" ? (clip as any).emoji ?? clip.name
    : clip.name;
  // For audio clips, find URL to render waveform
  const audioSrc = clip.kind === "audio" ? library.find((m) => m.id === (clip as any).sourceId) : undefined;

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1 rounded-md border overflow-hidden cursor-move flex items-center text-[11px] truncate select-none",
        color,
        (selected || multiselected) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}
      style={{ left, width: Math.max(width, 12) }}
      onMouseDown={(e) => onMouseDown(e, clip, "move")}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip.id, e.shiftKey);
      }}
      // Allow HTML5 drop events to bubble up so the track area can receive sidebar drops
      onDragOver={(e) => { e.stopPropagation(); }}
      onDrop={(e) => { /* let it bubble to track */ }}
    >
      {/* Trim left handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-10"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, clip, "trim-left"); }}
      />
      {/* Waveform (for audio) */}
      {audioSrc && width > 20 && (
        <div className="absolute inset-0 left-2 right-2 opacity-70 pointer-events-none">
          <Waveform url={audioSrc.url} color="#10b981" height={44} bars={Math.max(20, Math.floor(width / 4))} />
        </div>
      )}
      {/* Clip body */}
      <div className="relative flex items-center gap-1 min-w-0 px-2 z-[1]">
        {clip.kind === "video" && (clip as any).isImage ? "🖼️" : ""}
        {clip.kind === "video" && !(clip as any).isImage ? "🎬" : ""}
        {clip.kind === "audio" ? "🎵" : ""}
        {clip.kind === "text" ? "📝" : ""}
        {clip.kind === "sticker" ? (clip as any).emoji : ""}
        <span className="truncate">{label}</span>
      </div>
      {/* Transition indicators */}
      {clip.transitionIn && clip.transitionIn.kind !== "none" && (
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-purple-500/60 to-transparent" title={`In: ${clip.transitionIn.kind}`} />
      )}
      {clip.transitionOut && clip.transitionOut.kind !== "none" && (
        <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-l from-purple-500/60 to-transparent" title={`Out: ${clip.transitionOut.kind}`} />
      )}
      {/* Trim right handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-10"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, clip, "trim-right"); }}
      />
    </div>
  );
}
