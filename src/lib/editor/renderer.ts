// Canvas-based renderer for the editor preview & export
// Handles all clip types: video, image (treated as still video), text, sticker, audio
import type {
  AnyClip,
  ImageClip,
  MediaSource,
  ProjectSettings,
  StickerClip,
  TextClip,
  Track,
  VideoClip,
  AudioClip,
} from "./types";
import {
  adjustmentsToFilter,
  clamp01,
  computeContinuous,
  computeEntranceExit,
  computeTransition,
  interpolateKeyframes,
  wrapText,
} from "./render-utils";

export interface RenderResources {
  // preloaded image elements keyed by source url
  images: Map<string, HTMLImageElement>;
  // preloaded video elements keyed by source url
  videos: Map<string, HTMLVideoElement>;
  // audio elements
  audios: Map<string, HTMLAudioElement>;
}

export async function preloadMedia(sources: MediaSource[]): Promise<RenderResources> {
  const images = new Map<string, HTMLImageElement>();
  const videos = new Map<string, HTMLVideoElement>();
  const audios = new Map<string, HTMLAudioElement>();
  await Promise.all(
    sources.map(async (s) => {
      try {
        if (s.kind === "image") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error("img load err"));
            img.src = s.url;
          });
          images.set(s.url, img);
        } else if (s.kind === "video") {
          const v = document.createElement("video");
          v.crossOrigin = "anonymous";
          v.muted = true;
          v.playsInline = true;
          v.preload = "auto";
          // Some data: URL SVGs won't be videos - we treat them as images
          if (s.url.startsWith("data:image/")) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((res, rej) => {
              img.onload = () => res();
              img.onerror = () => rej(new Error("img load err"));
              img.src = s.url;
            });
            images.set(s.url, img);
            return;
          }
          await new Promise<void>((res, rej) => {
            v.onloadeddata = () => res();
            v.onerror = () => rej(new Error("video load err"));
            v.src = s.url;
            v.load();
          });
          videos.set(s.url, v);
        } else if (s.kind === "audio") {
          const a = new Audio();
          a.crossOrigin = "anonymous";
          a.preload = "auto";
          await new Promise<void>((res, rej) => {
            a.oncanplaythrough = () => res();
            a.onerror = () => rej(new Error("audio load err"));
            a.src = s.url;
          }).catch(() => {
            // ignore - will load lazily
          });
          audios.set(s.url, a);
        }
      } catch (e) {
        // ignore - we'll render a placeholder
      }
    })
  );
  return { images, videos, audios };
}

/** Returns the source for a given sourceId */
function getSource(library: MediaSource[], id: string): MediaSource | undefined {
  return library.find((m) => m.id === id);
}

/** Returns active clip at time t for given track */
function activeClipsAt(track: Track, t: number): AnyClip[] {
  return track.clips.filter((c) => c.start <= t && c.end >= t).sort((a, b) => a.start - b.start);
}

interface TransitionCtx {
  prev: AnyClip | null; // outgoing
  next: AnyClip | null; // incoming
  remaining: number;
}

/** Find transition active at time t for a track */
function transitionAt(track: Track, t: number): TransitionCtx | null {
  const clips = track.clips.slice().sort((a, b) => a.start - b.start);
  for (let i = 0; i < clips.length - 1; i++) {
    const cur = clips[i];
    const next = clips[i + 1];
    const transitionOut = cur.transitionOut;
    const transitionIn = next.transitionIn;
    const kind = transitionOut?.kind ?? transitionIn?.kind ?? "none";
    const dur = Math.max(transitionOut?.duration ?? 0, transitionIn?.duration ?? 0);
    if (kind !== "none" && dur > 0) {
      const overlap = Math.min(cur.end, next.start + dur) - Math.max(cur.start, next.start - dur);
      // If next starts before cur ends, there's an overlap; otherwise, transition occurs at cur.end..next.start
      const transitionStart = next.start - dur;
      const transitionEnd = next.start;
      if (t >= transitionStart && t <= transitionEnd) {
        return { prev: cur, next, remaining: transitionEnd - t };
      }
    }
  }
  return null;
}

export interface RenderOptions {
  /** When true, playback audio at the current time */
  playing?: boolean;
  /** Master time */
  time: number;
  /** Project settings */
  project: ProjectSettings;
  /** All media sources */
  library: MediaSource[];
  /** All tracks */
  tracks: Track[];
  /** Preloaded media elements */
  res: RenderResources;
  /** For sticker font, we need a canvas context. */
  ctx: CanvasRenderingContext2D;
  /** Canvas width in px */
  width: number;
  /** Canvas height in px */
  height: number;
}

/** Master render function: draws all clips at current time */
export function renderFrame(opts: RenderOptions): void {
  const { ctx, width, height, project, tracks, library, res, time } = opts;
  // Clear with background
  ctx.fillStyle = project.backgroundColor || "#000000";
  ctx.fillRect(0, 0, width, height);

  // Draw tracks in order (background → foreground). Tracks list is bottom-to-top by default.
  // We'll iterate in reverse so top track draws last (on top).
  const ordered = [...tracks];
  for (let i = ordered.length - 1; i >= 0; i--) {
    const track = ordered[i];
    if (track.hidden) continue;
    drawTrack(opts, track, time);
  }

  // Vignette overlay handled per-clip
}

function drawTrack(opts: RenderOptions, track: Track, t: number): void {
  const { ctx, width, height } = opts;

  // Handle transitions on video/text/sticker tracks
  const trans = transitionAt(track, t);
  if (trans) {
    // Draw the outgoing clip with transition fade/slide
    drawClip(opts, trans.prev!, t, trans);
    // The next clip is just starting - draw it
    drawClip(opts, trans.next!, t, trans);
    return;
  }

  const active = activeClipsAt(track, t);
  for (const clip of active) {
    drawClip(opts, clip, t, null);
  }
}

function drawClip(opts: RenderOptions, clip: AnyClip, t: number, trans: { prev: AnyClip | null; next: AnyClip | null; remaining: number } | null): void {
  const { ctx, width, height } = opts;
  if (clip.opacity === 0) return;

  // Compute transition multiplier
  let transOpacity = 1;
  let transTranslateX = 0;
  let transTranslateY = 0;
  let transScale = 1;
  let transBlur = 0;
  let transFlash = 0;
  if (trans) {
    if (trans.prev === clip) {
      // outgoing
      const dur = Math.max(
        clip.transitionOut?.duration ?? 0.5,
        (trans.next?.transitionIn?.duration ?? 0) ?? 0
      );
      const elapsed = dur - trans.remaining;
      const r = computeTransition(
        clip.transitionOut?.kind ?? trans.next?.transitionIn?.kind ?? "none",
        dur,
        elapsed
      );
      transOpacity = r.outOpacity;
      transTranslateX = (r.outTranslateX ?? 0) * width;
      transTranslateY = (r.outTranslateY ?? 0) * height;
      transScale = r.outScale ?? 1;
      transBlur = r.blurPx ?? 0;
      transFlash = r.flash ?? 0;
    } else if (trans.next === clip) {
      // incoming
      const dur = Math.max(
        clip.transitionIn?.duration ?? 0.5,
        (trans.prev?.transitionOut?.duration ?? 0) ?? 0
      );
      const elapsed = dur - trans.remaining;
      const r = computeTransition(
        clip.transitionIn?.kind ?? trans.prev?.transitionOut?.kind ?? "none",
        dur,
        elapsed
      );
      transOpacity = r.inOpacity;
      transTranslateX = (r.inTranslateX ?? 0) * width;
      transTranslateY = (r.inTranslateY ?? 0) * height;
      transScale = r.inScale ?? 1;
      transBlur = r.blurPx ?? 0;
      transFlash = r.flash ?? 0;
    }
  }

  if (clip.kind === "video" || (clip.kind === "sticker") || clip.kind === "text") {
    // video, image, text, sticker share transform pipeline
  }
  if (clip.kind === "audio") return; // audio not drawn

  // Local time within clip
  const localT = t - clip.start;
  const clipDur = clip.end - clip.start;

  // entrance/exit
  const ae = computeEntranceExit(clip.entrance, clip.exit, localT, clipDur, width, height);
  // continuous
  const ce = computeContinuous(clip.continuous, t);
  // keyframes
  const kf = interpolateKeyframes(clip.keyframes, localT, clip.start);

  // combine transform
  const opacity = clamp01(clip.opacity * (ae.opacity ?? 1) * transOpacity);
  if (opacity <= 0.001) return;

  const x = (kf.x ?? clip.x) * width;
  const y = (kf.y ?? clip.y) * height;
  const scale = (kf.scale ?? clip.scale) * (ae.scale ?? 1) * (ce.scale ?? 1) * transScale;
  const rotation = (clip.rotation + (ae.rotation ?? 0) + (ce.rotation ?? 0)) * Math.PI / 180;
  const tx = (ae.translateX ?? 0) + (ce.translateX ?? 0) + transTranslateX;
  const ty = (ae.translateY ?? 0) + (ce.translateY ?? 0) + transTranslateY;
  const blurPx = (ae.blurPx ?? 0) + (ce.blurPx ?? 0) + transBlur;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x + tx, y + ty);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  if (clip.kind === "video") {
    drawVideoClip(opts, clip as VideoClip, t);
  } else if (clip.kind === "text") {
    drawTextClip(opts, clip as TextClip, localT, ae.visibleChars ?? Infinity);
  } else if (clip.kind === "sticker") {
    drawStickerClip(opts, clip as StickerClip);
  }

  // flash overlay
  if (transFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${transFlash})`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }

  ctx.restore();
}

function drawVideoClip(opts: RenderOptions, clip: VideoClip, t: number): void {
  const { ctx, width, height, library, res, project } = opts;
  const src = getSource(library, clip.sourceId);
  if (!src) return;
  let media: HTMLImageElement | HTMLVideoElement | undefined;
  // SVG data URLs stored as video kind are actually images
  if (src.url.startsWith("data:image/") || clip.isImage) {
    media = res.images.get(src.url);
  } else if (src.kind === "image") {
    media = res.images.get(src.url);
  } else {
    media = res.videos.get(src.url);
    if (media && (media as HTMLVideoElement).currentTime !== undefined) {
      // Sync video time
      const v = media as HTMLVideoElement;
      const wanted = (clip.sourceStart ?? 0) + (t - clip.start) * clip.speed;
      if (Math.abs(v.currentTime - wanted) > 0.1) {
        try { v.currentTime = wanted; } catch {}
      }
      if (opts.playing && v.paused) {
        v.play().catch(() => {});
        v.muted = true;
      }
    }
  }
  if (!media) return;

  // Apply filters via canvas filter
  ctx.filter = adjustmentsToFilter(clip.adjustments);

  // Compute source crop & destination rectangle
  const cw = (clip.crop?.w ?? 1) * (media.videoWidth || media.naturalWidth || project.width);
  const ch = (clip.crop?.h ?? 1) * (media.videoHeight || media.naturalHeight || project.height);
  const csx = (clip.crop?.x ?? 0) * (media.videoWidth || media.naturalWidth || project.width);
  const csy = (clip.crop?.y ?? 0) * (media.videoHeight || media.naturalHeight || project.height);

  // Fit to canvas, contain
  const srcAspect = cw / ch;
  const dstAspect = width / height;
  let dw = width;
  let dh = height;
  if (srcAspect > dstAspect) {
    dh = width / srcAspect;
  } else {
    dw = height * srcAspect;
  }

  try {
    ctx.save();
    if (clip.flipH) {
      ctx.scale(-1, 1);
      ctx.translate(-width, 0);
    }
    if (clip.flipV) {
      ctx.scale(1, -1);
      ctx.translate(0, -height);
    }
    ctx.drawImage(media as any, csx, csy, cw, ch, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  } catch (e) {
    // SVG media may fail drawImage in some browsers; skip silently
  }

  ctx.filter = "none";

  // Vignette
  if (clip.adjustments.vignette > 0) {
    const g = ctx.createRadialGradient(0, 0, Math.min(width, height) * 0.3, 0, 0, Math.max(width, height) * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${clip.adjustments.vignette})`);
    ctx.fillStyle = g;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }
}

function drawTextClip(opts: RenderOptions, clip: TextClip, localT: number, visibleChars: number): void {
  const { ctx, width } = opts;
  const style = clip.style;
  let text = clip.text;
  if (style.uppercase) text = text.toUpperCase();
  if (visibleChars !== Infinity && visibleChars < text.length) {
    text = text.slice(0, visibleChars);
  }

  const fontSize = style.fontSize;
  ctx.font = `${style.italic ? "italic " : ""}${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${style.letterSpacing}px`;
  }

  // wrap
  const maxWidth = width * 0.9;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * style.lineHeight;
  const totalHeight = lines.length * lineHeight;
  let yOff = -totalHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    // Background
    if (style.backgroundOpacity > 0 && style.backgroundColor !== "transparent") {
      const metrics = ctx.measureText(line);
      const bw = metrics.width + fontSize * 0.4;
      const bh = lineHeight;
      ctx.fillStyle = style.backgroundColor.startsWith("#") ? hexToRgba(style.backgroundColor, style.backgroundOpacity) : style.backgroundColor;
      ctx.globalAlpha = (ctx.globalAlpha ?? 1) * style.backgroundOpacity;
      ctx.fillRect(-bw / 2, yOff - bh / 2, bw, bh);
      ctx.globalAlpha = (ctx.globalAlpha ?? 1) / style.backgroundOpacity;
    }
    // Shadow
    if (style.shadow) {
      ctx.shadowColor = style.shadowColor;
      ctx.shadowBlur = fontSize * 0.15;
      ctx.shadowOffsetX = fontSize * 0.05;
      ctx.shadowOffsetY = fontSize * 0.05;
    }
    // Stroke
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.lineJoin = "round";
      ctx.strokeText(line, 0, yOff);
    }
    // Fill - apply preset gradient for "gradient" and "fire" presets
    if (style.preset === "gradient" || style.preset === "fire") {
      const grad = ctx.createLinearGradient(0, yOff - fontSize / 2, 0, yOff + fontSize / 2);
      if (style.preset === "fire") {
        grad.addColorStop(0, "#FFD700");
        grad.addColorStop(0.5, "#FF8E53");
        grad.addColorStop(1, "#FF4500");
      } else {
        grad.addColorStop(0, "#FF006E");
        grad.addColorStop(1, style.color);
      }
      ctx.fillStyle = grad;
    } else if (style.preset === "neon") {
      ctx.shadowColor = style.shadowColor || style.color;
      ctx.shadowBlur = fontSize * 0.4;
      ctx.fillStyle = style.color;
    } else {
      ctx.fillStyle = style.color;
    }
    ctx.fillText(line, 0, yOff);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    yOff += lineHeight;
  }
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = "0px";
  }
}

function drawStickerClip(opts: RenderOptions, clip: StickerClip): void {
  const { ctx } = opts;
  ctx.font = `${clip.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(clip.emoji, 0, 0);
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Manage audio playback sync */
export function syncAudioPlayback(opts: RenderOptions): void {
  const { tracks, library, res, time, playing } = opts;
  for (const track of tracks) {
    if (track.kind !== "audio" || track.muted || track.hidden) continue;
    for (const clip of track.clips) {
      if (clip.kind !== "audio") continue;
      const ac = clip as AudioClip;
      const active = time >= ac.start && time <= ac.end;
      const src = getSource(library, ac.sourceId);
      if (!src) continue;
      const audio = res.audios.get(src.url);
      if (!audio) continue;
      audio.volume = ac.volume * (track.muted ? 0 : 1);
      if (active && playing) {
        const wanted = (ac.sourceStart ?? 0) + (time - ac.start) * ac.speed;
        if (audio.paused) {
          audio.play().catch(() => {});
        }
        if (Math.abs(audio.currentTime - wanted) > 0.2) {
          try { audio.currentTime = wanted; } catch {}
        }
      } else if (!active && !audio.paused) {
        audio.pause();
      }
    }
  }
  // Pause audio for clips not active
  for (const track of tracks) {
    if (track.kind !== "audio") continue;
    for (const clip of track.clips) {
      if (clip.kind !== "audio") continue;
      const active = time >= clip.start && time <= clip.end;
      if (!active) {
        const src = getSource(library, clip.sourceId);
        if (!src) continue;
        const audio = res.audios.get(src.url);
        if (audio && !audio.paused) audio.pause();
      }
    }
  }
}

/** Stop all audio */
export function stopAllAudio(res: RenderResources): void {
  for (const a of res.audios.values()) {
    a.pause();
    a.currentTime = 0;
  }
}
