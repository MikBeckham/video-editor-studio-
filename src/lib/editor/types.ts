// Core type definitions for the video editor

export type ThemeMode = "holiday" | "pro" | "studio";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "21:9";
export type FrameRate = 24 | 30 | 60;
export type ExportFormat = "mp4" | "webm" | "gif";
export type ExportMethod = "mediarecorder" | "ffmpeg";
export type QualityPreset = "low" | "medium" | "high" | "original";

export type TrackKind = "video" | "audio" | "text" | "sticker";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Keyframe {
  id: string;
  /** time in seconds, relative to clip start */
  t: number;
  props: Partial<AnimatableProps>;
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface AnimatableProps {
  x: number; // 0..1 relative to canvas
  y: number; // 0..1
  scale: number;
  rotation: number; // deg
  opacity: number; // 0..1
}

export type AnimationPresetKind =
  | "none"
  | "fadeIn"
  | "fadeOut"
  | "slideInLeft"
  | "slideInRight"
  | "slideInUp"
  | "slideInDown"
  | "popIn"
  | "popOut"
  | "bounceIn"
  | "typewriter"
  | "zoomIn"
  | "zoomOut"
  | "rotateIn"
  | "flipIn"
  | "blurIn";

export type ContinuousAnimKind =
  | "none"
  | "pulse"
  | "float"
  | "rotate"
  | "shake"
  | "swing"
  | "wobble"
  | "bounce";

export type TextStylePreset =
  | "clean"
  | "bold"
  | "neon"
  | "3d"
  | "outline"
  | "shadow"
  | "kinetic"
  | "holiday"
  | "gradient"
  | "fire";

export interface TextStyleProps {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0..1
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  shadowColor: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  italic: boolean;
  uppercase: boolean;
  preset: TextStylePreset;
}

export type FilterKind =
  | "none"
  | "vivid"
  | "warm"
  | "cool"
  | "vintage"
  | "bw"
  | "sepia"
  | "noir"
  | "dramatic"
  | "fade"
  | "dreamy"
  | "vignette"
  | "invert"
  | "blur";

export interface FilterAdjustments {
  brightness: number; // 1 = normal
  contrast: number; // 1
  saturate: number; // 1
  hueRotate: number; // deg
  blur: number; // px
  grayscale: number; // 0..1
  sepia: number; // 0..1
  invert: number; // 0..1
  vignette: number; // 0..1
}

export type TransitionKind =
  | "none"
  | "fade"
  | "dissolve"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "zoomIn"
  | "zoomOut"
  | "wipeLeft"
  | "wipeRight"
  | "wipeUp"
  | "wipeDown"
  | "circle"
  | "diamond"
  | "glitch"
  | "flash"
  | "blur";

export interface TransitionConfig {
  kind: TransitionKind;
  duration: number; // seconds
}

export interface MediaSource {
  id: string;
  kind: "video" | "image" | "audio";
  url: string;
  name: string;
  duration?: number; // seconds for video/audio
  width?: number;
  height?: number;
  thumbnail?: string;
  isSample?: boolean;
}

export interface BaseClip {
  id: string;
  trackId: string;
  kind: TrackKind;
  /** timeline position (s) */
  start: number;
  /** timeline end (s) */
  end: number;
  /** source offset for media */
  sourceStart?: number;
  sourceEnd?: number;
  name: string;
  // transform
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  // animations
  entrance: AnimationPresetKind;
  exit: AnimationPresetKind;
  continuous: ContinuousAnimKind;
  keyframes: Keyframe[];
  // transitions
  transitionIn?: TransitionConfig;
  transitionOut?: TransitionConfig;
}

export interface VideoClip extends BaseClip {
  kind: "video";
  sourceId: string;
  filters: FilterKind;
  adjustments: FilterAdjustments;
  speed: number; // 1 = normal
  volume: number; // 0..1
  reverse: boolean;
  crop?: { x: number; y: number; w: number; h: number }; // 0..1 each
  flipH?: boolean;
  flipV?: boolean;
  isImage?: boolean;
}

export interface AudioClip extends BaseClip {
  kind: "audio";
  sourceId: string;
  volume: number;
  fadeIn: number; // s
  fadeOut: number; // s
  speed: number;
}

export interface TextClip extends BaseClip {
  kind: "text";
  text: string;
  style: TextStyleProps;
}

export interface StickerClip extends BaseClip {
  kind: "sticker";
  emoji: string;
  size: number;
  color?: string;
}

export type AnyClip = VideoClip | AudioClip | TextClip | StickerClip;

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
  clips: AnyClip[];
  muted?: boolean;
  locked?: boolean;
  hidden?: boolean;
}

export interface ProjectSettings {
  name: string;
  aspectRatio: AspectRatio;
  fps: FrameRate;
  width: number;
  height: number;
  backgroundColor: string;
  theme: ThemeMode;
}

export interface ExportSettings {
  format: ExportFormat;
  method: ExportMethod;
  quality: QualityPreset;
  fps: FrameRate;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
}

export interface ProjectState {
  project: ProjectSettings;
  tracks: Track[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  playhead: number;
  isPlaying: boolean;
  duration: number;
  zoom: number; // timeline zoom (px per second)
}
