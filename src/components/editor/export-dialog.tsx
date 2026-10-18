'use client';
// Export dialog - all format options, FFmpeg.wasm + MediaRecorder
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { ASPECT_RATIOS, FRAME_RATES } from "@/lib/editor/constants";
import {
  exportVideo,
  downloadBlob,
} from "@/lib/editor/export-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Film,
  Loader2,
  FileVideo,
  Image as ImageIcon,
  Music2,
  Settings,
  X,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  preloadMedia,
  type RenderResources,
} from "@/lib/editor/renderer";
import type { ExportSettings, QualityPreset, ExportFormat, ExportMethod } from "@/lib/editor/types";

interface ExportDialogProps {
  onClose: () => void;
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const project = useEditorStore((s) => s.project);
  const tracks = useEditorStore((s) => s.tracks);
  const library = useEditorStore((s) => s.mediaLibrary);
  const exportSettings = useEditorStore((s) => s.exportSettings);
  const setExportSettings = useEditorStore((s) => s.setExportSettings);

  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string; name: string; mime: string } | null>(null);
  const [res, setRes] = useState<RenderResources | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    preloadMedia(library).then(setRes);
  }, [library]);

  const update = (patch: Partial<ExportSettings>) => setExportSettings(patch);

  const handleExport = async () => {
    if (!canvasRef.current || !res) {
      setErrorMsg("Resources not ready. Please wait a moment and try again.");
      return;
    }
    // Recalc duration
    let duration = 0;
    for (const t of tracks) {
      for (const c of t.clips) {
        if (c.end > duration) duration = c.end;
      }
    }
    if (duration <= 0) {
      setErrorMsg("Nothing to export — add some clips to the timeline first.");
      return;
    }
    setExporting(true);
    setProgress(0);
    setPhase("Initializing");
    setResult(null);
    setErrorMsg(null);
    cancelRef.current = false;
    try {
      const settings = {
        ...exportSettings,
        width: project.width,
        height: project.height,
        fps: exportSettings.fps,
        aspectRatio: project.aspectRatio,
      } as ExportSettings;
      const result = await exportVideo(
        canvasRef.current,
        project,
        tracks,
        library,
        settings,
        (p, ph) => {
          setProgress(p);
          if (ph) setPhase(ph);
        },
        cancelRef,
      );
      if (cancelRef.current) {
        setErrorMsg("Export was cancelled.");
        setExporting(false);
        setPhase("");
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const safeName = project.name.replace(/[^a-z0-9_\-]+/gi, "_").toLowerCase() || "video";
      const filename = `${safeName}.${result.extension}`;
      setResult({ blob: result.blob, url, name: filename, mime: result.mimeType });
      toast.success("Export complete!");
    } catch (e: any) {
      const msg = e?.message ?? "Unknown error";
      if (msg.includes("cancelled")) {
        setErrorMsg("Export was cancelled by user.");
      } else {
        setErrorMsg(`Export failed: ${msg}`);
      }
      console.error(e);
    } finally {
      setExporting(false);
      setPhase("");
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setPhase("Cancelling...");
  };

  const handleRetry = () => {
    setErrorMsg(null);
    handleExport();
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result.blob, result.name);
    toast.success("Download started");
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v && !exporting) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" /> Export Video
          </DialogTitle>
          <DialogDescription>
            Choose format, quality, and method. Higher quality takes longer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Format selection */}
          <div>
            <Label className="text-xs uppercase text-muted-foreground mb-1.5 block">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "mp4", label: "MP4 (H.264)", icon: FileVideo, desc: "Best compatibility" },
                { v: "webm", label: "WebM (VP9)", icon: Film, desc: "Smaller files" },
                { v: "gif", label: "Animated GIF", icon: ImageIcon, desc: "Social media" },
              ] as { v: ExportFormat; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[]).map((f) => (
                <button
                  key={f.v}
                  onClick={() => update({ format: f.v })}
                  disabled={exporting}
                  className={`flex flex-col items-center gap-1 p-3 rounded-md border ${exportSettings.format === f.v ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <f.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method selection (only for video) */}
          {exportSettings.format !== "gif" && (
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1.5 block">Export Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => update({ method: "mediarecorder" })}
                  disabled={exporting}
                  className={`flex flex-col items-center gap-1 p-3 rounded-md border ${exportSettings.method === "mediarecorder" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <span className="text-xs font-medium">MediaRecorder</span>
                  <span className="text-[10px] text-muted-foreground">Fast, browser-native</span>
                </button>
                <button
                  onClick={() => update({ method: "ffmpeg" })}
                  disabled={exporting || exportSettings.format !== "mp4"}
                  className={`flex flex-col items-center gap-1 p-3 rounded-md border ${exportSettings.method === "ffmpeg" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"} ${exportSettings.format !== "mp4" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="text-xs font-medium">FFmpeg.wasm</span>
                  <span className="text-[10px] text-muted-foreground">True H.264 MP4 (loads ~25MB)</span>
                </button>
              </div>
            </div>
          )}

          {/* Quality */}
          {exportSettings.format !== "gif" && (
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1.5 block">Quality</Label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { v: "low", label: "Low" },
                  { v: "medium", label: "Medium" },
                  { v: "high", label: "High" },
                  { v: "original", label: "Original" },
                ] as { v: QualityPreset; label: string }[]).map((q) => (
                  <button
                    key={q.v}
                    onClick={() => update({ quality: q.v })}
                    disabled={exporting}
                    className={`text-xs py-2 rounded border ${exportSettings.quality === q.v ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FPS + Aspect */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1.5 block">Frame Rate</Label>
              <Select value={String(exportSettings.fps)} onValueChange={(v) => update({ fps: Number(v) as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FRAME_RATES.map((f) => (
                    <SelectItem key={f} value={String(f)}>{f} FPS</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground mb-1.5 block">Aspect Ratio</Label>
              <Select value={exportSettings.aspectRatio} onValueChange={(v) => update({ aspectRatio: v as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resolution display */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            Output: <span className="font-mono">{project.width}×{project.height}</span> @ {exportSettings.fps}FPS · {exportSettings.format.toUpperCase()}
            {exportSettings.format !== "gif" && (
              <span className="ml-2">· {exportSettings.method === "ffmpeg" ? "FFmpeg.wasm" : "MediaRecorder"}</span>
            )}
          </div>

          {/* Hidden canvas for export rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Progress */}
          {exporting && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {phase || "Exporting..."}
                </span>
                <span className="font-mono">{Math.round(progress * 100)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {exportSettings.method === "ffmpeg" && exportSettings.format === "mp4"
                  ? "Loading FFmpeg.wasm (~25MB) and transcoding. This may take a few minutes."
                  : "Recording in real-time. Keep this tab active."}
              </p>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 w-fit">
                <X className="w-3.5 h-3.5" /> Cancel Export
              </Button>
            </div>
          )}

          {/* Error display with retry */}
          {errorMsg && !exporting && (
            <div className="border border-destructive/30 bg-destructive/5 rounded p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-destructive text-sm">⚠</span>
                <span className="text-xs">{errorMsg}</span>
              </div>
              <Button size="sm" variant="default" onClick={handleRetry} className="gap-2 w-fit">
                <RotateCcw className="w-3.5 h-3.5" /> Retry Export
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Export Complete!</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {(result.blob.size / 1024 / 1024).toFixed(2)} MB · {result.mime}
                </span>
              </div>
              {result.mime.startsWith("video/") ? (
                <video src={result.url} controls className="w-full max-h-48 rounded" />
              ) : result.mime.startsWith("image/") ? (
                <img src={result.url} alt="export" className="w-full max-h-48 object-contain rounded" />
              ) : null}
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="w-3.5 h-3.5" /> Download {result.name}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                  Export Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            <X className="w-3.5 h-3.5 mr-1" /> Close
          </Button>
          <Button onClick={handleExport} disabled={exporting || !!result} className="gap-2">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? "Exporting..." : errorMsg ? "Retry" : "Start Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
