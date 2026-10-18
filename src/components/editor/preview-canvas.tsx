'use client';
// Preview canvas - renders the editor preview in real-time
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import {
  preloadMedia,
  renderFrame,
  stopAllAudio,
  syncAudioPlayback,
  type RenderResources,
} from "@/lib/editor/renderer";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PreviewCanvasProps {
  className?: string;
}

export default function PreviewCanvas({ className }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resourcesRef = useRef<RenderResources | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastWallRef = useRef<number>(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const project = useEditorStore((s) => s.project);
  const tracks = useEditorStore((s) => s.tracks);
  const library = useEditorStore((s) => s.mediaLibrary);
  const playhead = useEditorStore((s) => s.playhead);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);

  // Preload media when library changes
  useEffect(() => {
    let cancelled = false;
    preloadMedia(library).then((res) => {
      if (cancelled) return;
      resourcesRef.current = res;
    });
    return () => {
      cancelled = true;
      if (resourcesRef.current) stopAllAudio(resourcesRef.current);
    };
  }, [library]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const previewScale = 0.5;
    canvas.width = project.width * previewScale;
    canvas.height = project.height * previewScale;

    let lastT = playhead;

    const renderLoop = () => {
      const res = resourcesRef.current;
      if (!res) {
        rafRef.current = requestAnimationFrame(renderLoop);
        return;
      }
      let t = useEditorStore.getState().playhead;
      if (useEditorStore.getState().isPlaying) {
        const now = performance.now();
        const delta = (now - lastWallRef.current) / 1000;
        lastWallRef.current = now;
        t = lastT + delta;
        if (t > useEditorStore.getState().duration) {
          t = 0;
        }
        useEditorStore.getState().setPlayhead(t);
      } else {
        lastWallRef.current = performance.now();
      }
      lastT = t;
      const W = canvas.width;
      const H = canvas.height;
      renderFrame({
        ctx,
        width: W,
        height: H,
        project,
        tracks,
        library,
        res,
        time: t,
        playing: useEditorStore.getState().isPlaying && !mutedRef.current,
      });
      syncAudioPlayback({
        ctx,
        width: W,
        height: H,
        project,
        tracks,
        library,
        res,
        time: t,
        playing: useEditorStore.getState().isPlaying && !mutedRef.current,
      });
      rafRef.current = requestAnimationFrame(renderLoop);
    };
    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [project, tracks, library]);

  useEffect(() => {
    if (!isPlaying && resourcesRef.current) {
      stopAllAudio(resourcesRef.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (resourcesRef.current) stopAllAudio(resourcesRef.current);
    };
  }, []);

  const aspectClass = project.aspectRatio === "9:16"
    ? "aspect-[9/16]"
    : project.aspectRatio === "1:1"
    ? "aspect-square"
    : project.aspectRatio === "4:5"
    ? "aspect-[4/5]"
    : project.aspectRatio === "21:9"
    ? "aspect-[21/9]"
    : "aspect-video";

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex-1 flex items-center justify-center min-h-0 relative p-2">
        <div
          className={`relative ${aspectClass} w-full max-h-full bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10`}
          style={{ maxHeight: "100%" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          {duration === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm pointer-events-none">
              <div className="text-center">
                <p className="text-base font-medium text-white/60">Preview Canvas</p>
                <p className="text-xs mt-1 text-white/30">Add media or text from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Transport controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card/60 border border-border rounded-lg">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setPlayhead(0);
            setIsPlaying(false);
          }}
          title="Back to start"
          className="h-8 w-8"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="default"
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-primary hover:bg-primary/90 h-9 w-9"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setPlayhead(duration)}
          title="Go to end"
          className="h-8 w-8"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (next && resourcesRef.current) {
              stopAllAudio(resourcesRef.current);
            }
          }}
          title={muted ? "Unmute" : "Mute"}
          className="h-8 w-8"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <span className="text-xs font-mono text-muted-foreground tabular-nums ml-1">
          {formatTime(playhead)} / {formatTime(duration)}
        </span>
        <div className="flex-1" />
        <Slider
          value={[Math.min(playhead, duration || 0)]}
          max={Math.max(duration, 0.1)}
          step={0.01}
          onValueChange={(v) => {
            setPlayhead(v[0]);
            setIsPlaying(false);
          }}
          className="w-48"
        />
      </div>
    </div>
  );
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.floor((t * 100) % 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
