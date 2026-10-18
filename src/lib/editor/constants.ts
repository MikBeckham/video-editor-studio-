// All preset constants for the editor
import type {
  AnimationPresetKind,
  AspectRatio,
  ContinuousAnimKind,
  FilterAdjustments,
  FilterKind,
  TextStylePreset,
  TextStyleProps,
  TransitionKind,
} from "./types";

export const ASPECT_RATIOS: { value: string; label: string; w: number; h: number }[] = [
  { value: "16:9", label: "16:9 Landscape", w: 1920, h: 1080 },
  { value: "9:16", label: "9:16 Vertical / Reels", w: 1080, h: 1920 },
  { value: "1:1", label: "1:1 Square", w: 1080, h: 1080 },
  { value: "4:5", label: "4:5 Portrait", w: 1080, h: 1350 },
  { value: "21:9", label: "21:9 Cinematic", w: 2560, h: 1080 },
];

export const FRAME_RATES: number[] = [24, 30, 60];

export const FONT_FAMILIES = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Montserrat, sans-serif", label: "Montserrat" },
  { value: "Bebas Neue, sans-serif", label: "Bebas Neue" },
  { value: "Anton, sans-serif", label: "Anton" },
  { value: "Playfair Display, serif", label: "Playfair" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "Comic Sans MS, cursive", label: "Comic Sans" },
  { value: "Arial Black, sans-serif", label: "Arial Black" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
];

export const COLOR_PALETTE = [
  "#FFFFFF", "#000000", "#FFD700", "#FF6B6B", "#FF8E53",
  "#FEC260", "#2EC4B6", "#3A86FF", "#8338EC", "#FF006E",
  "#FB5607", "#FFBE0B", "#06FFA5", "#00B4D8", "#0077B6",
  "#03045E", "#7209B7", "#B5179E", "#F72585", "#4CC9F0",
  "#06D6A0", "#118AB2", "#073B4C", "#EF476F", "#FFC6AC",
];

// Animation presets
export const ENTRANCE_ANIMATIONS: { value: AnimationPresetKind; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade In" },
  { value: "slideInLeft", label: "Slide from Left" },
  { value: "slideInRight", label: "Slide from Right" },
  { value: "slideInUp", label: "Slide Up" },
  { value: "slideInDown", label: "Slide Down" },
  { value: "popIn", label: "Pop In" },
  { value: "bounceIn", label: "Bounce In" },
  { value: "typewriter", label: "Typewriter" },
  { value: "zoomIn", label: "Zoom In" },
  { value: "rotateIn", label: "Rotate In" },
  { value: "flipIn", label: "Flip In" },
  { value: "blurIn", label: "Blur In" },
];

export const EXIT_ANIMATIONS: { value: AnimationPresetKind; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fadeOut", label: "Fade Out" },
  { value: "popOut", label: "Pop Out" },
  { value: "zoomOut", label: "Zoom Out" },
];

export const CONTINUOUS_ANIMATIONS: { value: ContinuousAnimKind; label: string }[] = [
  { value: "none", label: "None" },
  { value: "pulse", label: "Pulse" },
  { value: "float", label: "Float" },
  { value: "rotate", label: "Rotate" },
  { value: "shake", label: "Shake" },
  { value: "swing", label: "Swing" },
  { value: "wobble", label: "Wobble" },
  { value: "bounce", label: "Bounce" },
];

export const TEXT_STYLE_PRESETS: { value: TextStylePreset; label: string; apply: (s: TextStyleProps) => TextStyleProps }[] = [
  {
    value: "clean",
    label: "Clean",
    apply: (s) => ({ ...s, preset: "clean", shadow: false, strokeWidth: 0, backgroundColor: "transparent", backgroundOpacity: 0 }),
  },
  {
    value: "bold",
    label: "Bold",
    apply: (s) => ({ ...s, preset: "bold", fontWeight: 900, shadow: true, shadowColor: "#000000", strokeWidth: 0 }),
  },
  {
    value: "neon",
    label: "Neon Glow",
    apply: (s) => ({ ...s, preset: "neon", color: "#00FFE0", shadow: true, shadowColor: "#00FFE0", strokeWidth: 0, fontWeight: 700 }),
  },
  {
    value: "3d",
    label: "3D Block",
    apply: (s) => ({ ...s, preset: "3d", color: "#FFD700", shadow: true, shadowColor: "#000000", strokeWidth: 2, strokeColor: "#000000" }),
  },
  {
    value: "outline",
    label: "Outline",
    apply: (s) => ({ ...s, preset: "outline", strokeWidth: 3, strokeColor: "#FFFFFF", color: "#000000", shadow: false }),
  },
  {
    value: "shadow",
    label: "Shadow",
    apply: (s) => ({ ...s, preset: "shadow", shadow: true, shadowColor: "#000000", strokeWidth: 0 }),
  },
  {
    value: "kinetic",
    label: "Kinetic",
    apply: (s) => ({ ...s, preset: "kinetic", fontWeight: 900, color: "#FFFFFF", backgroundColor: "#000000", backgroundOpacity: 1, shadow: false, letterSpacing: 2 }),
  },
  {
    value: "holiday",
    label: "Holiday",
    apply: (s) => ({ ...s, preset: "holiday", color: "#FFD700", shadow: true, shadowColor: "#0a1931", strokeWidth: 2, strokeColor: "#0a1931" }),
  },
  {
    value: "gradient",
    label: "Gradient",
    apply: (s) => ({ ...s, preset: "gradient", color: "#FF6B6B", shadow: false, strokeWidth: 0 }),
  },
  {
    value: "fire",
    label: "Fire",
    apply: (s) => ({ ...s, preset: "fire", color: "#FF4500", shadow: true, shadowColor: "#FFD700", strokeWidth: 2, strokeColor: "#8B0000" }),
  },
];

export const DEFAULT_TEXT_STYLE: TextStyleProps = {
  fontFamily: "Inter, sans-serif",
  fontSize: 64,
  fontWeight: 700,
  color: "#FFFFFF",
  backgroundColor: "transparent",
  backgroundOpacity: 0,
  strokeColor: "#000000",
  strokeWidth: 0,
  shadow: true,
  shadowColor: "#000000",
  letterSpacing: 0,
  lineHeight: 1.2,
  textAlign: "center",
  italic: false,
  uppercase: false,
  preset: "clean",
};

// Cinematic Color LUT presets — apply to video clips for pro color grading
export interface ColorLUTPreset {
  id: string;
  name: string;
  description: string;
  adjustments: FilterAdjustments;
  thumbnailGradient: string; // CSS gradient for preview swatch
}

export const COLOR_LUT_PRESETS: ColorLUTPreset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Teal-orange Hollywood look",
    adjustments: { brightness: 1.05, contrast: 1.2, saturate: 1.15, hueRotate: -5, blur: 0, grayscale: 0, sepia: 0.05, invert: 0, vignette: 0.4 },
    thumbnailGradient: "linear-gradient(135deg, #0ea5e9, #f59e0b)",
  },
  {
    id: "noir-film",
    name: "Noir Film",
    description: "Classic black-and-white film noir",
    adjustments: { brightness: 0.95, contrast: 1.35, saturate: 0, hueRotate: 0, blur: 0, grayscale: 1, sepia: 0.1, invert: 0, vignette: 0.55 },
    thumbnailGradient: "linear-gradient(135deg, #1c1917, #57534e)",
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description: "Faded 70s analog film",
    adjustments: { brightness: 1.05, contrast: 0.9, saturate: 0.85, hueRotate: -8, blur: 0, grayscale: 0, sepia: 0.35, invert: 0, vignette: 0.35 },
    thumbnailGradient: "linear-gradient(135deg, #d97706, #92400e)",
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    description: "Golden hour color temperature",
    adjustments: { brightness: 1.1, contrast: 1.05, saturate: 1.2, hueRotate: -15, blur: 0, grayscale: 0, sepia: 0.2, invert: 0, vignette: 0.15 },
    thumbnailGradient: "linear-gradient(135deg, #f97316, #dc2626)",
  },
  {
    id: "cool-arctic",
    name: "Cool Arctic",
    description: "Cold blue tones",
    adjustments: { brightness: 1.05, contrast: 1.1, saturate: 0.95, hueRotate: 25, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0.1 },
    thumbnailGradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
  },
  {
    id: "moody-purple",
    name: "Moody Purple",
    description: "Synthwave night vibe",
    adjustments: { brightness: 0.95, contrast: 1.25, saturate: 1.3, hueRotate: 280, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0.5 },
    thumbnailGradient: "linear-gradient(135deg, #8b5cf6, #c026d3)",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural earthy greens",
    adjustments: { brightness: 1.0, contrast: 1.1, saturate: 1.1, hueRotate: -45, blur: 0, grayscale: 0, sepia: 0.1, invert: 0, vignette: 0.2 },
    thumbnailGradient: "linear-gradient(135deg, #16a34a, #166534)",
  },
  {
    id: "rosey-pink",
    name: "Rosey Pink",
    description: "Soft romantic pinks",
    adjustments: { brightness: 1.1, contrast: 0.95, saturate: 1.05, hueRotate: 320, blur: 0.2, grayscale: 0, sepia: 0, invert: 0, vignette: 0.1 },
    thumbnailGradient: "linear-gradient(135deg, #ec4899, #f472b6)",
  },
];

// Social media template presets — quick project setups for common platforms
export interface SocialTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  duration: number; // seconds — recommended timeline length
  presetTexts: { text: string; start: number; end: number; stylePreset: TextStylePreset }[];
}

export const SOCIAL_TEMPLATES: SocialTemplate[] = [
  {
    id: "reels-9-16",
    name: "Instagram Reel",
    description: "9:16 vertical — 30s reel with intro + outro",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    duration: 30,
    presetTexts: [
      { text: "WATCH THIS", start: 0, end: 3, stylePreset: "bold" },
      { text: "Follow for more", start: 27, end: 30, stylePreset: "kinetic" },
    ],
  },
  {
    id: "tiktok-9-16",
    name: "TikTok",
    description: "9:16 vertical — 15s viral hook",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    duration: 15,
    presetTexts: [
      { text: "POV:", start: 0, end: 2, stylePreset: "bold" },
      { text: "Wait for it...", start: 5, end: 8, stylePreset: "neon" },
    ],
  },
  {
    id: "youtube-intro",
    name: "YouTube Intro",
    description: "16:9 landscape — 8s intro with logo",
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
    duration: 8,
    presetTexts: [
      { text: "Channel Name", start: 0, end: 4, stylePreset: "3d" },
      { text: "Subscribe", start: 5, end: 8, stylePreset: "fire" },
    ],
  },
  {
    id: "yt-shorts-9-16",
    name: "YouTube Shorts",
    description: "9:16 vertical — 60s short",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    duration: 60,
    presetTexts: [
      { text: "Quick Tip", start: 0, end: 3, stylePreset: "bold" },
      { text: "Like & Subscribe", start: 55, end: 60, stylePreset: "kinetic" },
    ],
  },
  {
    id: "instagram-square",
    name: "Instagram Post",
    description: "1:1 square — 30s feed post",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
    duration: 30,
    presetTexts: [
      { text: "Hello", start: 0, end: 5, stylePreset: "clean" },
    ],
  },
  {
    id: "twitter-clip",
    name: "Twitter / X Clip",
    description: "16:9 landscape — 45s clip",
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
    duration: 45,
    presetTexts: [
      { text: "Breaking", start: 0, end: 3, stylePreset: "bold" },
    ],
  },
];

// Filter presets
export const FILTER_PRESETS: { value: FilterKind; label: string; adjustments: FilterAdjustments }[] = [
  { value: "none", label: "Original", adjustments: { brightness: 1, contrast: 1, saturate: 1, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0 } },
  { value: "vivid", label: "Vivid", adjustments: { brightness: 1.1, contrast: 1.15, saturate: 1.4, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0 } },
  { value: "warm", label: "Warm", adjustments: { brightness: 1.05, contrast: 1.05, saturate: 1.15, hueRotate: -10, blur: 0, grayscale: 0, sepia: 0.15, invert: 0, vignette: 0 } },
  { value: "cool", label: "Cool", adjustments: { brightness: 1.0, contrast: 1.05, saturate: 1.0, hueRotate: 15, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0 } },
  { value: "vintage", label: "Vintage", adjustments: { brightness: 0.95, contrast: 1.1, saturate: 0.85, hueRotate: 0, blur: 0, grayscale: 0.1, sepia: 0.4, invert: 0, vignette: 0.4 } },
  { value: "bw", label: "B&W", adjustments: { brightness: 1.0, contrast: 1.1, saturate: 0, hueRotate: 0, blur: 0, grayscale: 1, sepia: 0, invert: 0, vignette: 0 } },
  { value: "sepia", label: "Sepia", adjustments: { brightness: 1.0, contrast: 1.0, saturate: 1.0, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0.8, invert: 0, vignette: 0 } },
  { value: "noir", label: "Noir", adjustments: { brightness: 0.9, contrast: 1.4, saturate: 0, hueRotate: 0, blur: 0, grayscale: 1, sepia: 0, invert: 0, vignette: 0.6 } },
  { value: "dramatic", label: "Dramatic", adjustments: { brightness: 0.95, contrast: 1.3, saturate: 1.15, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0.5 } },
  { value: "fade", label: "Fade", adjustments: { brightness: 1.1, contrast: 0.85, saturate: 0.8, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0.1, invert: 0, vignette: 0.15 } },
  { value: "dreamy", label: "Dreamy", adjustments: { brightness: 1.1, contrast: 0.95, saturate: 1.2, hueRotate: 5, blur: 1.5, grayscale: 0, sepia: 0, invert: 0, vignette: 0.1 } },
  { value: "vignette", label: "Vignette", adjustments: { brightness: 1.0, contrast: 1.05, saturate: 1.05, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0.7 } },
  { value: "invert", label: "Invert", adjustments: { brightness: 1.0, contrast: 1.0, saturate: 1.0, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 1, vignette: 0 } },
  { value: "blur", label: "Blur", adjustments: { brightness: 1.0, contrast: 1.0, saturate: 1.0, hueRotate: 0, blur: 5, grayscale: 0, sepia: 0, invert: 0, vignette: 0 } },
];

export const DEFAULT_ADJUSTMENTS: FilterAdjustments = {
  brightness: 1, contrast: 1, saturate: 1, hueRotate: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0,
};

// Transition presets
export const TRANSITION_PRESETS: { value: TransitionKind; label: string; defaultDuration: number }[] = [
  { value: "none", label: "None", defaultDuration: 0 },
  { value: "fade", label: "Fade", defaultDuration: 0.5 },
  { value: "dissolve", label: "Dissolve", defaultDuration: 0.6 },
  { value: "slideLeft", label: "Slide Left", defaultDuration: 0.5 },
  { value: "slideRight", label: "Slide Right", defaultDuration: 0.5 },
  { value: "slideUp", label: "Slide Up", defaultDuration: 0.5 },
  { value: "slideDown", label: "Slide Down", defaultDuration: 0.5 },
  { value: "zoomIn", label: "Zoom In", defaultDuration: 0.4 },
  { value: "zoomOut", label: "Zoom Out", defaultDuration: 0.4 },
  { value: "wipeLeft", label: "Wipe Left", defaultDuration: 0.5 },
  { value: "wipeRight", label: "Wipe Right", defaultDuration: 0.5 },
  { value: "wipeUp", label: "Wipe Up", defaultDuration: 0.5 },
  { value: "wipeDown", label: "Wipe Down", defaultDuration: 0.5 },
  { value: "circle", label: "Circle", defaultDuration: 0.6 },
  { value: "diamond", label: "Diamond", defaultDuration: 0.6 },
  { value: "glitch", label: "Glitch", defaultDuration: 0.4 },
  { value: "flash", label: "Flash", defaultDuration: 0.3 },
  { value: "blur", label: "Blur", defaultDuration: 0.5 },
];

// Sticker emojis
export const STICKER_CATEGORIES = [
  { name: "Emojis", items: ["😀", "😂", "🥰", "😎", "🤩", "😍", "🤗", "😇", "🥳", "🤔", "😱", "😭", "😡", "🤯", "🥺", "😴", "🤤", "😬", "🙃", "😈"] },
  { name: "Gestures", items: ["👍", "👎", "👏", "🙌", "🙏", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "👋", "💪", "🤝"] },
  { name: "Hearts", items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"] },
  { name: "Party", items: ["🎉", "🎊", "🎈", "🎁", "🎂", "🍰", "🧁", "🎄", "🎃", "🎀", "🪅", "🪩", " Champagne", "🍻", "🥂", "🍷", "🍸", "🍹", "🍾", "🥳"] },
  { name: "Stars", items: ["⭐", "🌟", "✨", "💫", "⚡", "🔥", "💯", "💥", "☄️", "🌠", "💫", "🏵️", "🎖️", "🏆", "🥇", "🥈", "🥉", "🏅", "👑", "💎"] },
  { name: "Nature", items: ["🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🍀", "🌿", "🌴", "🌳", "🌲", "🌈", "☀️", "⛅", "☁️", "🌧️", "⛈️", "❄️", "🌙", "🌊"] },
  { name: "Symbols", items: ["✅", "❌", "❓", "❗", "⚠️", "🚫", "✔️", "✖️", "➕", "➖", "➗", "❎", "💯", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫"] },
  { name: "Animals", items: ["🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🦄", "🐴", "🐦", "🦅", "🦉", "🐺", "🦋", "🐢"] },
];

export const TEXT_PRESET_TEMPLATES: { name: string; text: string; style: Partial<TextStyleProps>; fontSize?: number }[] = [
  { name: "Title", text: "Title Here", style: { preset: "bold", fontWeight: 900, fontSize: 80, color: "#FFFFFF", shadow: true } },
  { name: "Subtitle", text: "Subtitle Text", style: { preset: "clean", fontSize: 48, color: "#FFFFFF", shadow: true } },
  { name: "Caption", text: "Caption", style: { preset: "shadow", fontSize: 36, color: "#FFFFFF", backgroundColor: "#000000", backgroundOpacity: 0.6 } },
  { name: "Lower Third", text: "Name / Role", style: { preset: "kinetic", fontSize: 40, color: "#FFFFFF", backgroundColor: "#0a1931", backgroundOpacity: 1 } },
  { name: "Quote", text: "\"Quote here\"", style: { preset: "neon", fontSize: 56, color: "#FFD700", italic: true } },
  { name: "Call Out", text: "CALL OUT!", style: { preset: "fire", fontSize: 64, color: "#FF4500", fontWeight: 900, uppercase: true } },
  { name: "Holiday", text: "Happy Holidays!", style: { preset: "holiday", fontSize: 72, color: "#FFD700", strokeColor: "#0a1931", strokeWidth: 3 } },
  { name: "Number", text: "01", style: { preset: "3d", fontSize: 120, color: "#FFD700", strokeWidth: 4 } },
  { name: "Button", text: "Click Here", style: { preset: "kinetic", fontSize: 32, color: "#FFFFFF", backgroundColor: "#FFD700", backgroundOpacity: 1 } },
  { name: "Tag", text: "#trending", style: { preset: "gradient", fontSize: 40, color: "#FF006E" } },
];
