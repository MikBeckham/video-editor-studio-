// Render utilities: animations, filters, transitions, easing
import type {
  AnimationPresetKind,
  ContinuousAnimKind,
  FilterAdjustments,
  Keyframe,
  TransitionKind,
} from "./types";

// ---------- Easing ----------
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const clamp = (t: number, min: number, max: number) => Math.max(min, Math.min(max, t));

// ---------- Entrance/Exit animations ----------
const ENTRANCE_DURATION = 0.6; // seconds
const EXIT_DURATION = 0.5;

export interface AnimOverride {
  opacity?: number;
  translateX?: number; // px in canvas space
  translateY?: number;
  scale?: number;
  rotation?: number;
  blurPx?: number;
  visibleChars?: number; // for typewriter
}

/**
 * Computes override transform for entrance/exit animations
 * `localT` is time (s) since clip start
 * `clipDur` is the total clip duration
 */
export function computeEntranceExit(
  entrance: AnimationPresetKind,
  exit: AnimationPresetKind,
  localT: number,
  clipDur: number,
  canvasW: number,
  canvasH: number
): AnimOverride {
  const o: AnimOverride = { opacity: 1, scale: 1, rotation: 0, translateX: 0, translateY: 0, blurPx: 0, visibleChars: Infinity };

  // entrance
  const ein = clamp01(localT / ENTRANCE_DURATION);
  if (entrance !== "none" && localT < ENTRANCE_DURATION) {
    switch (entrance) {
      case "fadeIn":
        o.opacity = ein;
        break;
      case "slideInLeft":
        o.opacity = ein;
        o.translateX = -canvasW * (1 - ein);
        break;
      case "slideInRight":
        o.opacity = ein;
        o.translateX = canvasW * (1 - ein);
        break;
      case "slideInUp":
        o.opacity = ein;
        o.translateY = canvasH * (1 - ein);
        break;
      case "slideInDown":
        o.opacity = ein;
        o.translateY = -canvasH * (1 - ein);
        break;
      case "popIn": {
        const e = easings.easeOut(ein);
        o.scale = 0.3 + 0.7 * e;
        o.opacity = ein;
        break;
      }
      case "bounceIn": {
        const b = bounceEase(ein);
        o.scale = b;
        o.opacity = clamp01(ein * 2);
        break;
      }
      case "typewriter": {
        o.visibleChars = Math.floor(ein * 100);
        o.opacity = 1;
        break;
      }
      case "zoomIn":
        o.opacity = ein;
        o.scale = 0.5 + 0.5 * easings.easeOut(ein);
        break;
      case "zoomOut":
        o.opacity = ein;
        o.scale = 2 - 1 * easings.easeOut(ein);
        break;
      case "rotateIn":
        o.opacity = ein;
        o.rotation = -180 * (1 - easings.easeOut(ein));
        o.scale = 0.5 + 0.5 * ein;
        break;
      case "flipIn":
        o.opacity = ein;
        o.scale = 0.3 + 0.7 * ein;
        o.rotation = 90 * (1 - ein);
        break;
      case "blurIn":
        o.opacity = ein;
        o.blurPx = 20 * (1 - ein);
        break;
      case "fadeOut":
      case "popOut":
        // exit anims handled below
        break;
    }
  }

  // exit
  const remaining = clipDur - localT;
  if (exit !== "none" && remaining < EXIT_DURATION) {
    const eout = clamp01(remaining / EXIT_DURATION);
    switch (exit) {
      case "fadeOut":
        o.opacity = Math.min(o.opacity ?? 1, eout);
        break;
      case "popOut":
        o.scale = (o.scale ?? 1) * eout;
        o.opacity = Math.min(o.opacity ?? 1, eout);
        break;
      case "zoomOut":
        o.scale = (o.scale ?? 1) * eout;
        o.opacity = Math.min(o.opacity ?? 1, eout);
        break;
    }
  }

  return o;
}

function bounceEase(t: number): number {
  // simple bounce
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75;
    return 7.5625 * t * t + 0.75;
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75;
    return 7.5625 * t * t + 0.9375;
  }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}

// ---------- Continuous animations ----------
export function computeContinuous(
  kind: ContinuousAnimKind,
  t: number // global time (use for loop)
): AnimOverride {
  const o: AnimOverride = {};
  switch (kind) {
    case "pulse": {
      const v = 1 + 0.06 * Math.sin(t * Math.PI * 2);
      o.scale = v;
      break;
    }
    case "float": {
      o.translateY = 10 * Math.sin(t * Math.PI * 2);
      break;
    }
    case "rotate": {
      o.rotation = (t * 60) % 360;
      break;
    }
    case "shake": {
      o.translateX = 5 * Math.sin(t * 40);
      o.translateY = 3 * Math.cos(t * 40);
      break;
    }
    case "swing": {
      o.rotation = 8 * Math.sin(t * Math.PI * 2);
      break;
    }
    case "wobble": {
      o.rotation = 5 * Math.sin(t * Math.PI * 4);
      o.scale = 1 + 0.04 * Math.cos(t * Math.PI * 4);
      break;
    }
    case "bounce": {
      const period = 1;
      const phase = (t % period) / period;
      const v = Math.abs(Math.sin(phase * Math.PI));
      o.translateY = -20 * v;
      o.scale = 1 + 0.05 * v;
      break;
    }
    case "none":
    default:
      break;
  }
  return o;
}

// ---------- Keyframe interpolation ----------
export function interpolateKeyframes(
  keyframes: Keyframe[],
  localT: number,
  clipStart: number
): Partial<{ x: number; y: number; scale: number; rotation: number; opacity: number }> {
  if (!keyframes.length) return {};
  const sorted = [...keyframes].sort((a, b) => a.t - b.t);
  if (localT <= sorted[0].t) return sorted[0].props;
  if (localT >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].props;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (localT >= a.t && localT <= b.t) {
      const tt = (localT - a.t) / Math.max(0.0001, b.t - a.t);
      const eased = a.ease === "easeIn" ? easings.easeIn(tt)
        : a.ease === "easeOut" ? easings.easeOut(tt)
        : a.ease === "easeInOut" ? easings.easeInOut(tt)
        : tt;
      const result: any = {};
      const keys = new Set([...Object.keys(a.props), ...Object.keys(b.props)]);
      for (const k of keys) {
        const av = (a.props as any)[k];
        const bv = (b.props as any)[k];
        if (typeof av === "number" && typeof bv === "number") {
          (result as any)[k] = av + (bv - av) * eased;
        } else if (typeof av === "number") {
          (result as any)[k] = av;
        } else if (typeof bv === "number") {
          (result as any)[k] = bv;
        }
      }
      return result;
    }
  }
  return {};
}

// ---------- Filter to canvas CSS-like string ----------
export function adjustmentsToFilter(a: FilterAdjustments): string {
  return [
    `brightness(${a.brightness})`,
    `contrast(${a.contrast})`,
    `saturate(${a.saturate})`,
    `hue-rotate(${a.hueRotate}deg)`,
    `blur(${a.blur}px)`,
    `grayscale(${a.grayscale})`,
    `sepia(${a.sepia})`,
    `invert(${a.invert})`,
  ].join(" ");
}

// ---------- Transitions ----------
export interface TransitionResult {
  /** opacity multiplier for outgoing clip 0..1 */
  outOpacity: number;
  /** opacity multiplier for incoming clip 0..1 */
  inOpacity: number;
  /** translate fraction for outgoing (-1..1 of canvas) */
  outTranslateX?: number;
  outTranslateY?: number;
  /** translate fraction for incoming */
  inTranslateX?: number;
  inTranslateY?: number;
  /** scale for incoming */
  inScale?: number;
  outScale?: number;
  /** vignette / wipe progress 0..1 */
  wipe?: number;
  /** color flash 0..1 */
  flash?: number;
  /** glitch offset */
  glitch?: number;
  /** blur px */
  blurPx?: number;
}

export function computeTransition(
  kind: TransitionKind,
  duration: number,
  t: number // time since transition started
): TransitionResult {
  const p = clamp01(t / Math.max(0.001, duration));
  switch (kind) {
    case "fade":
      return { outOpacity: 1 - p, inOpacity: p };
    case "dissolve":
      return { outOpacity: 1 - p, inOpacity: p, blurPx: 8 * p * (1 - p) * 4 };
    case "slideLeft":
      return { outOpacity: 1, inOpacity: 1, outTranslateX: -p, inTranslateX: 1 - p };
    case "slideRight":
      return { outOpacity: 1, inOpacity: 1, outTranslateX: p, inTranslateX: -(1 - p) };
    case "slideUp":
      return { outOpacity: 1, inOpacity: 1, outTranslateY: -p, inTranslateY: 1 - p };
    case "slideDown":
      return { outOpacity: 1, inOpacity: 1, outTranslateY: p, inTranslateY: -(1 - p) };
    case "zoomIn":
      return { outOpacity: 1 - p, inOpacity: p, inScale: 0.5 + 0.5 * p, outScale: 1 + 0.5 * p };
    case "zoomOut":
      return { outOpacity: 1 - p, inOpacity: p, inScale: 1.5 - 0.5 * p, outScale: 1 - 0.3 * p };
    case "wipeLeft":
      return { outOpacity: 1, inOpacity: 1, wipe: p };
    case "wipeRight":
      return { outOpacity: 1, inOpacity: 1, wipe: -p };
    case "wipeUp":
      return { outOpacity: 1, inOpacity: 1, wipe: p };
    case "wipeDown":
      return { outOpacity: 1, inOpacity: 1, wipe: -p };
    case "circle":
      return { outOpacity: 1, inOpacity: 1, wipe: p };
    case "diamond":
      return { outOpacity: 1, inOpacity: 1, wipe: p };
    case "glitch":
      return { outOpacity: 1 - 0.3 * Math.sin(p * 10), inOpacity: 0.3 + 0.7 * p, glitch: 1 - p };
    case "flash":
      return { outOpacity: 1 - p, inOpacity: p, flash: Math.sin(p * Math.PI) };
    case "blur":
      return { outOpacity: 1 - p, inOpacity: p, blurPx: 20 * Math.sin(p * Math.PI) };
    case "none":
    default:
      return { outOpacity: 1, inOpacity: 0 };
  }
}

// ---------- Helpers for canvas text wrapping ----------
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const p of paragraphs) {
    const words = p.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (!words.length) lines.push("");
  }
  return lines;
}
