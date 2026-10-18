// Export utilities - canvas-based MediaRecorder, GIF export, optional FFmpeg.wasm
import type {
  ExportSettings,
  MediaSource,
  ProjectSettings,
  Track,
} from "./types";
import {
  preloadMedia,
  renderFrame,
  stopAllAudio,
  syncAudioPlayback,
  type RenderResources,
} from "./renderer";

export interface ExportResult {
  blob: Blob;
  mimeType: string;
  extension: string;
}

const MIME_BY_FORMAT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
};

const EXT_BY_FORMAT: Record<string, string> = {
  mp4: "mp4",
  webm: "webm",
  gif: "gif",
};

/**
 * Pick the best supported MediaRecorder mime type for the requested format.
 */
function pickMime(format: string): string {
  const candidates =
    format === "mp4"
      ? [
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4;codecs=avc1.42E01E",
          "video/mp4",
        ]
      : format === "webm"
      ? [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9",
          "video/webm",
        ]
      : ["image/gif"];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return MIME_BY_FORMAT[format];
}

/** Maps quality preset to bitrate in bits per second */
function qualityToBitrate(q: string, w: number, h: number, fps: number): number {
  const pixels = w * h * fps;
  const bpp = q === "low" ? 0.03 : q === "medium" ? 0.06 : q === "high" ? 0.12 : 0.2;
  return Math.round(pixels * bpp);
}

/**
 * Export video using MediaRecorder API and canvas.captureStream.
 * Renders frame-by-frame in real-time using requestAnimationFrame.
 * Supports cancellation via the AbortSignal-like mechanism.
 */
export async function exportWithMediaRecorder(
  canvas: HTMLCanvasElement,
  project: ProjectSettings,
  tracks: Track[],
  library: MediaSource[],
  settings: ExportSettings,
  onProgress?: (p: number) => void,
  res?: RenderResources,
  cancelRef?: { current: boolean }
): Promise<ExportResult> {
  // Recalc duration
  let duration = 0;
  for (const t of tracks) {
    for (const c of t.clips) {
      if (c.end > duration) duration = c.end;
    }
  }
  if (duration <= 0) duration = 5;

  const width = settings.width;
  const height = settings.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Cannot get canvas 2d context");

  // Preload resources if not provided
  let resources = res;
  if (!resources) {
    resources = await preloadMedia(library);
  }

  const fps = settings.fps;
  const mime = pickMime(settings.format);

  // captureStream
  const stream = (canvas as any).captureStream(fps) as MediaStream;
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: qualityToBitrate(settings.quality, width, height, fps),
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = (e: any) => reject(new Error("MediaRecorder error: " + (e?.error?.message ?? "unknown")));
  });

  recorder.start();

  // Render loop
  const startWall = performance.now();
  await new Promise<void>((resolve, reject) => {
    let currentT = 0;
    const total = duration;
    const tick = () => {
      // Check for cancellation
      if (cancelRef?.current) {
        try { recorder.stop(); } catch {}
        reject(new Error("Export cancelled by user"));
        return;
      }
      currentT = (performance.now() - startWall) / 1000;
      if (currentT > total) currentT = total;
      // Render
      try {
        renderFrame({
          ctx,
          width,
          height,
          project,
          tracks,
          library,
          res: resources!,
          time: currentT,
          playing: true,
        });
        syncAudioPlayback({
          ctx,
          width,
          height,
          project,
          tracks,
          library,
          res: resources!,
          time: currentT,
          playing: true,
        });
      } catch (e) {
        // Continue rendering even on per-frame errors
        console.warn("Frame render error:", e);
      }
      onProgress?.(Math.min(1, currentT / total));
      if (currentT < total) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });

  // Allow recorder to capture the last frame
  await new Promise((r) => setTimeout(r, 200));
  if (recorder.state !== "inactive") {
    try { recorder.stop(); } catch {}
  }
  await stopped;
  stopAllAudio(resources);

  if (cancelRef?.current) {
    throw new Error("Export cancelled by user");
  }

  if (chunks.length === 0) {
    throw new Error("Export failed: no data was captured. Try a different format/method or check your media.");
  }

  const blob = new Blob(chunks, { type: mime });
  // Sanity check on blob size (warn if very small — likely failed)
  if (blob.size < 1024) {
    throw new Error(`Export produced only ${blob.size} bytes — this likely failed. Check your timeline has content and try again.`);
  }
  return {
    blob,
    mimeType: mime,
    extension: mime.startsWith("image/gif") ? "gif" : settings.format,
  };
}

/**
 * Export GIF using a simple frame-grabber. We capture N frames at fixed intervals.
 * Uses a basic GIF encoder. For very large output, this can be slow.
 */
export async function exportGif(
  canvas: HTMLCanvasElement,
  project: ProjectSettings,
  tracks: Track[],
  library: MediaSource[],
  settings: ExportSettings,
  onProgress?: (p: number) => void,
  res?: RenderResources
): Promise<ExportResult> {
  // Use gif.js from CDN
  // We need to load gif.js dynamically
  await loadGifJs();
  // Recalc duration
  let duration = 0;
  for (const t of tracks) {
    for (const c of t.clips) {
      if (c.end > duration) duration = c.end;
    }
  }
  if (duration <= 0) duration = 5;

  const width = settings.width;
  const height = settings.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Cannot get canvas 2d context");

  let resources = res;
  if (!resources) {
    resources = await preloadMedia(library);
  }

  const fps = Math.min(settings.fps, 15); // GIF max 15fps for size
  const frameCount = Math.ceil(duration * fps);
  const delay = Math.round(1000 / fps);

  const gif = new (window as any).GIF({
    workers: 2,
    quality: 10,
    width,
    height,
    workerScript: "https://cdn.jsdelivr.net/npm/gif.js.optimized@0.2.1/dist/gif.worker.js",
  });

  // Render & capture each frame
  for (let i = 0; i < frameCount; i++) {
    const t = i / fps;
    renderFrame({
      ctx,
      width,
      height,
      project,
      tracks,
      library,
      res: resources,
      time: t,
      playing: false,
    });
    // Capture frame
    gif.addFrame(ctx, { copy: true, delay });
    onProgress?.((i + 1) / frameCount * 0.7);
    await new Promise((r) => setTimeout(r, 1)); // yield
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    gif.on("finished", (b: Blob) => resolve(b));
    gif.on("abort", () => reject(new Error("aborted")));
    gif.render();
  });
  onProgress?.(1);
  stopAllAudio(resources);
  return { blob, mimeType: "image/gif", extension: "gif" };
}

let gifJsLoaded: Promise<void> | null = null;
function loadGifJs(): Promise<void> {
  if (gifJsLoaded) return gifJsLoaded;
  if ((window as any).GIF) return Promise.resolve();
  gifJsLoaded = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/gif.js.optimized@0.2.1/dist/gif.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load gif.js"));
    document.head.appendChild(s);
  });
  return gifJsLoaded;
}

let ffmpegInstance: any = null;
let ffmpegLoading: Promise<any> | null = null;

/**
 * Load FFmpeg.wasm (optional, used for true MP4 H.264 when MediaRecorder can't)
 */
export async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;
  ffmpegLoading = (async () => {
    // Use @ffmpeg/ffmpeg via CDN UMD build (single-file)
    await loadScript("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js");
    const { FFmpeg } = (window as any).FFmpegWASM;
    const ff = new FFmpeg();
    // load core (multi-threaded for performance)
    await ff.load({
      coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      wasmURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
    });
    ffmpegInstance = ff;
    return ff;
  })();
  return ffmpegLoading;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load script " + src));
    document.head.appendChild(s);
  });
}

/**
 * Convert webm/mp4 blob to true MP4 H.264 using FFmpeg.wasm
 */
export async function convertWithFFmpeg(
  input: Blob,
  format: ExportSettings["format"],
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ff = await loadFFmpeg();
  const { fetchFile } = (window as any).FFmpegUtil;
  const inputExt = input.type.includes("webm") ? "webm" : "mp4";
  await ff.writeFile(`in.${inputExt}`, await fetchFile(input));
  // Listen for progress
  ff.on("progress", ({ progress }: { progress: number }) => {
    onProgress?.(progress);
  });
  await ff.exec([
    "-i", `in.${inputExt}`,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    `out.mp4`,
  ]);
  const data = await ff.readFile("out.mp4");
  // Cleanup
  try { await ff.deleteFile(`in.${inputExt}`); } catch {}
  try { await ff.deleteFile("out.mp4"); } catch {}
  return new Blob([data], { type: "video/mp4" });
}

/**
 * Master export function: chooses method based on settings.format & method.
 * Supports cancellation via cancelRef.
 */
export async function exportVideo(
  canvas: HTMLCanvasElement,
  project: ProjectSettings,
  tracks: Track[],
  library: MediaSource[],
  settings: ExportSettings,
  onProgress?: (p: number, phase?: string) => void,
  cancelRef?: { current: boolean }
): Promise<ExportResult> {
  if (cancelRef?.current) throw new Error("Export cancelled by user");
  onProgress?.(0, "preparing");
  // Always start with MediaRecorder for video/audio; GIF is special
  if (settings.format === "gif") {
    return exportGif(canvas, project, tracks, library, settings, (p) => onProgress?.(p, "rendering"));
  }
  // For MP4: first record as webm (universally supported by MediaRecorder), then transcode with FFmpeg
  if (settings.format === "mp4" && settings.method === "ffmpeg") {
    const tempSettings = { ...settings, format: "webm" as const, method: "mediarecorder" as const };
    const tmp = await exportWithMediaRecorder(
      canvas, project, tracks, library, tempSettings,
      (p) => onProgress?.(p * 0.6, "recording"),
      undefined,
      cancelRef,
    );
    if (cancelRef?.current) throw new Error("Export cancelled by user");
    onProgress?.(0.6, "converting");
    const mp4Blob = await convertWithFFmpeg(tmp.blob, "mp4", (p) => onProgress?.(0.6 + 0.4 * p, "converting"));
    return { blob: mp4Blob, mimeType: "video/mp4", extension: "mp4" };
  }
  // Direct MediaRecorder for webm or browser-native mp4
  return exportWithMediaRecorder(
    canvas, project, tracks, library, settings,
    (p) => onProgress?.(p, "recording"),
    undefined,
    cancelRef,
  );
}

/** Triggers a download for the given blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
