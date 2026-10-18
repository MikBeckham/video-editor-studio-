// Comprehensive user guide content - all features documented
export interface GuideSection {
  id: string;
  title: string;
  icon: string; // emoji
  description: string;
  features: GuideFeature[];
}

export interface GuideFeature {
  name: string;
  description: string;
  tips?: string[];
}

export const USER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    description: "Quick overview to start editing your video.",
    features: [
      {
        name: "Load Demo Project",
        description: "Click the 'Demo' button in the header to instantly load a sample project with text, stickers, and animations to explore.",
        tips: ["Great way to see how animations work", "Press Space to play the demo"],
      },
      {
        name: "Add Media",
        description: "Open the 'Media' tab in the left sidebar. Upload your own files (video/image/audio), pick from samples, use stock photos, or record from webcam.",
        tips: ["Drag-drop files directly into the upload zone", "Sample assets work without internet"],
      },
      {
        name: "Drag to Timeline",
        description: "Drag any media, text template, sticker, or audio from the sidebar directly onto a timeline track. Or click an item to add it to the library first.",
        tips: ["Hover over items to see 'Drag to Timeline' hint", "Drop on correct track kind (audio on audio track, text on text track)"],
      },
      {
        name: "Preview & Play",
        description: "Use the Play button (or Space key) to preview your edit. Use the time scrubber to seek to any moment.",
        tips: ["Arrow keys move frame by frame", "Home/End jumps to start/end"],
      },
      {
        name: "Export Your Video",
        description: "Click 'Export' button or press Ctrl+E to open the export dialog. Choose format (MP4/WebM/GIF), quality, and download.",
        tips: ["MediaRecorder is fast (real-time)", "FFmpeg.wasm gives true H.264 MP4 but takes longer"],
      },
    ],
  },
  {
    id: "layout",
    title: "Editor Layout",
    icon: "🖼️",
    description: "Four main areas of the editor interface.",
    features: [
      { name: "Top Header", description: "Project name, undo/redo, copy/paste/duplicate/delete buttons, aspect ratio & FPS, theme toggle, Demo button, save/open/shortcuts/export buttons." },
      { name: "Left Sidebar (Tools)", description: "7 tabs: Media, Text, Sticker, Filter, Trans, Audio, Magic. Each contains asset library and editing tools." },
      { name: "Center Preview", description: "Live canvas rendering with transport controls (play/pause, seek, mute). Shows real-time preview of all layers." },
      { name: "Right Inspector", description: "Properties of selected clip: Animations, Transform, Keyframes tabs. Edits apply instantly to preview." },
      { name: "Bottom Timeline", description: "Multi-track timeline with clips. Drag to move, drag handles to trim, use Split button to cut at playhead." },
    ],
  },
  {
    id: "media",
    title: "Media Library",
    icon: "🎬",
    description: "Add video, image, and audio assets to your project.",
    features: [
      { name: "Upload Files", description: "Click upload zone or drag-drop video/image/audio files. Supports MP4, WebM, MOV, PNG, JPG, MP3, WAV, M4A, OGG." },
      { name: "Sample Assets", description: "4 pre-loaded animated SVG samples (Holiday Gradient, Pink Purple, Star Burst, Vertical Reel). No internet needed." },
      { name: "Stock Library", description: "8 free stock images from Pexels (Beach Sunset, River Rocks, Forest, Mountain, City Sky, Coffee, Flowers, Snow). Click to add to library." },
      { name: "Webcam Recording", description: "Click 'Start Preview' to enable webcam, then 'Start Recording' to capture. Recorded clips auto-add to library as WebM." },
      { name: "Drag to Timeline", description: "All media items are draggable. Drag any item from sidebar to a timeline track. Drop position determines clip start time." },
      { name: "Remove Media", description: "Hover over a media item and click the trash icon to remove it from library." },
    ],
  },
  {
    id: "text",
    title: "Text & Captions",
    icon: "✍️",
    description: "Add animated text with custom styles.",
    features: [
      { name: "10 Text Templates", description: "Title, Subtitle, Caption, Lower Third, Quote, Call Out, Holiday, Number, Button, Tag. Click or drag to add." },
      { name: "10 Style Presets", description: "Clean, Bold, Neon Glow, 3D Block, Outline, Shadow, Kinetic, Holiday, Gradient, Fire. Apply to selected text." },
      { name: "12 Font Families", description: "Inter, Poppins, Montserrat, Bebas Neue, Anton, Playfair Display, Georgia, Courier, Impact, Comic Sans, Arial Black, Trebuchet." },
      { name: "Color Controls", description: "25-color palette + custom color picker. Set text color, stroke color, background color, shadow color independently." },
      { name: "Typography", description: "Font size (12-240px), weight (300-900), letter spacing (-5 to 20px), line height (0.6-2.5), italic, uppercase, alignment." },
      { name: "Stroke & Shadow", description: "Adjustable stroke width (0-10px) and color. Toggle shadow with custom shadow color." },
      { name: "Background", description: "Adjustable background opacity (0-100%) with custom background color. Great for caption boxes." },
      { name: "T Shortcut", description: "Press 'T' to instantly add a 'Your Text' clip at playhead. Edit it in the inspector." },
    ],
  },
  {
    id: "stickers",
    title: "Stickers & Emojis",
    icon: "😄",
    description: "Add animated emoji stickers to your videos.",
    features: [
      { name: "8 Categories", description: "Emojis (20), Gestures (20), Hearts (20), Party (20), Stars (20), Nature (20), Symbols (20), Animals (20) - 160+ total." },
      { name: "Drag or Click", description: "Drag any emoji to the sticker track, or click to add at playhead." },
      { name: "Default Animations", description: "Stickers come pre-configured with 'popIn' entrance, 'popOut' exit, and 'bounce' continuous animation. Change in Inspector." },
      { name: "Adjustable Size", description: "Use the Inspector to change sticker size, position, scale, rotation." },
    ],
  },
  {
    id: "filters",
    title: "Filters & Effects",
    icon: "🎨",
    description: "Apply cinematic filters and manual adjustments to video/image clips.",
    features: [
      { name: "14 Filter Presets", description: "Original, Vivid, Warm, Cool, Vintage, B&W, Sepia, Noir, Dramatic, Fade, Dreamy, Vignette, Invert, Blur." },
      { name: "9 Manual Adjustments", description: "Brightness, Contrast, Saturation, Hue Rotate, Blur, Grayscale, Sepia, Invert, Vignette - all sliders." },
      { name: "Transform Controls", description: "Scale (0.1-3x), Rotation (-180° to 180°), Opacity (0-100%), Position X/Y, Flip H/V." },
      { name: "Speed Control", description: "Video speed (0.25-4x). Slow motion or fast forward. Affects playback and export." },
      { name: "Volume Control", description: "Per-clip audio volume (0-100%). Mute individual clips." },
      { name: "Reset Button", description: "Quick reset to defaults with the Reset button in adjustments panel." },
    ],
  },
  {
    id: "transitions",
    title: "Transitions",
    icon: "🔀",
    description: "Smooth transitions between clips on the same track.",
    features: [
      { name: "18 Transition Types", description: "None, Fade, Dissolve, Slide (L/R/U/D), Zoom In/Out, Wipe (L/R/U/D), Circle, Diamond, Glitch, Flash, Blur." },
      { name: "Transition In (Entrance)", description: "Applied to the start of a clip. Triggered when clip becomes active." },
      { name: "Transition Out (Exit)", description: "Applied to the end of a clip. Triggered when next clip is about to start." },
      { name: "Adjustable Duration", description: "Each transition has a default duration, adjustable from 0.1 to 3 seconds via slider." },
      { name: "Per-Clip Configuration", description: "Select a clip in the Transitions tab to set its in/out transitions. Visual indicators appear on the clip bar." },
    ],
  },
  {
    id: "audio",
    title: "Audio",
    icon: "🎵",
    description: "Background music, voice-over, and audio adjustments.",
    features: [
      { name: "Upload Audio", description: "Drag-drop or click to upload MP3, WAV, M4A, OGG files. Auto-detected duration." },
      { name: "Generate Audio", description: "Built-in tone generator: Beep, Chime, Drum, Music - synthesized using Web Audio API and saved as WAV." },
      { name: "Volume Control", description: "Per-clip volume (0-100%). Track-level mute toggle (M button on track header)." },
      { name: "Fade In/Out", description: "Per-clip fade in (0-5s) and fade out (0-5s). Smooth audio transitions." },
      { name: "Audio Speed", description: "Per-clip speed (0.25-4x). Slow down or speed up audio." },
      { name: "Track Controls", description: "Mute, Lock, Hide toggles per audio track. Independent from video." },
    ],
  },
  {
    id: "animations",
    title: "Animations",
    icon: "✨",
    description: "Make text, stickers, and clips move and animate.",
    features: [
      { name: "13 Entrance Animations", description: "None, Fade In, Slide (L/R/U/D), Pop In, Bounce In, Typewriter, Zoom In, Rotate In, Flip In, Blur In." },
      { name: "4 Exit Animations", description: "None, Fade Out, Pop Out, Zoom Out." },
      { name: "7 Continuous Loops", description: "None, Pulse, Float, Rotate, Shake, Swing, Wobble, Bounce. Loops for the entire clip duration." },
      { name: "Keyframe Animation", description: "Add keyframes at any playhead position to animate position, scale, rotation, opacity. 4 easing curves: linear, easeIn, easeOut, easeInOut." },
      { name: "Real-time Preview", description: "All animations play live in the preview canvas. No rendering needed to see them." },
      { name: "Combine Animations", description: "Stack entrance + continuous + keyframes for complex motion. Each layer applies on top of the previous." },
    ],
  },
  {
    id: "timeline",
    title: "Timeline",
    icon: "⏱️",
    description: "Multi-track timeline with full editing power.",
    features: [
      { name: "4 Default Tracks", description: "Video Track (sky blue), Text Track (amber), Audio Track (emerald), Sticker Track (pink). Add more with the + buttons." },
      { name: "Color-coded Tracks", description: "Each track kind has a distinct color, so you can quickly identify clip types." },
      { name: "Drag to Move Clips", description: "Click and drag any clip on the timeline to move it. Snaps to adjacent clips within 0.2s." },
      { name: "Trim Handles", description: "Hover over clip edges to see trim handles. Drag left/right edge to trim clip start/end." },
      { name: "Split at Playhead", description: "Press 'S' or click Split button to cut selected clip at the playhead position. Creates two clips." },
      { name: "Delete Clips", description: "Press Delete/Backspace or click trash button. Removed clips can be restored with Undo." },
      { name: "Track Controls", description: "Per-track: Hide (eye icon), Mute (audio only, speaker icon), Lock (lock icon), Remove track (trash icon)." },
      { name: "Zoom Controls", description: "+/- buttons or keyboard shortcuts to zoom timeline in/out. Adjusts pixels-per-second." },
      { name: "Ruler & Playhead", description: "Click anywhere on ruler to set playhead. Red line + handle shows current position. Auto-scrolls during playback." },
    ],
  },
  {
    id: "preview",
    title: "Preview Canvas",
    icon: "👁️",
    description: "Real-time playback with full animation rendering.",
    features: [
      { name: "Transport Controls", description: "Back to Start, Play/Pause (Space), Go to End, Mute/Unmute, Time Scrubber." },
      { name: "Aspect Ratios", description: "5 presets: 16:9 Landscape (1920x1080), 9:16 Vertical Reels (1080x1920), 1:1 Square (1080x1080), 4:5 Portrait (1080x1350), 21:9 Cinematic (2560x1080)." },
      { name: "Frame Rates", description: "24, 30, or 60 FPS. Affects playback and export." },
      { name: "Time Format", description: "MM:SS.CS format (minutes:seconds.centiseconds). Precise seeking." },
      { name: "Live Rendering", description: "Canvas-based rendering with all animations, transitions, filters, text styles applied in real-time." },
    ],
  },
  {
    id: "inspector",
    title: "Inspector Panel",
    icon: "🔧",
    description: "Edit selected clip's properties - 3 tabs.",
    features: [
      { name: "Animate Tab", description: "Choose Entrance animation, Exit animation, Continuous loop. Apply with one click." },
      { name: "Transform Tab", description: "Position X/Y (0-100%), Scale (0.1-3x), Rotation (-180° to 180°), Opacity (0-100%), Start/End time sliders." },
      { name: "Keys Tab (Keyframes)", description: "Add keyframes at current playhead. Edit X, Y, Scale, Rotation, Opacity per keyframe. Choose easing curve. Delete keyframes individually." },
    ],
  },
  {
    id: "export",
    title: "Export & Download",
    icon: "💾",
    description: "Render and download your video in multiple formats.",
    features: [
      { name: "3 Formats", description: "MP4 (H.264 - best compatibility), WebM (VP9 - smaller files), Animated GIF (for social media)." },
      { name: "2 Export Methods", description: "MediaRecorder (fast, browser-native, real-time recording), FFmpeg.wasm (true H.264 MP4, loads ~25MB on first use, transcodes from WebM)." },
      { name: "4 Quality Presets", description: "Low (smaller files, lower bitrate), Medium, High, Original (highest quality)." },
      { name: "3 Frame Rates", description: "24, 30, or 60 FPS export. Match your project FPS or change for output." },
      { name: "5 Aspect Ratios", description: "Same 5 presets as preview: 16:9, 9:16, 1:1, 4:5, 21:9." },
      { name: "Live Progress", description: "Real-time progress bar with phase indicator (recording / converting / preparing). Shows percentage." },
      { name: "Preview Before Download", description: "After export completes, preview the video in the dialog. Then click Download to save." },
      { name: "Auto Filename", description: "Uses your project name (sanitized) as filename. e.g., 'My Video Project' → 'my_video_project.mp4'." },
    ],
  },
  {
    id: "themes",
    title: "Themes",
    icon: "🎭",
    description: "Three visual themes for the editor UI.",
    features: [
      { name: "Studio Theme (Default, Recommended)", description: "Premium midnight navy (#0b1220) + charcoal (#111827) + slate text + subtle blue accent (#3b82f6). CapCut/Premiere-inspired professional look.", tips: ["Best for long editing sessions - easy on eyes", "Default theme on new projects"] },
      { name: "Holiday Theme", description: "Gold (#FFD700) on dark blue (#0a1931). Festive look. Original theme from your Holiday Catcher editor.", tips: ["Great for holiday-themed projects", "High contrast gold on navy"] },
      { name: "Pro Editor Theme", description: "Neutral slate/zinc dark theme like Adobe Premiere. Distraction-free professional editing.", tips: ["Pure grayscale - no color accents", "Good for color-sensitive work"] },
      { name: "Quick Toggle", description: "Click the theme name button in the header to instantly switch between Studio/Holiday/Pro. Affects only UI, not your project.", tips: ["Theme is saved with project", "JSON export preserves theme setting"] },
    ],
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: "⌨️",
    description: "Pro-level shortcuts to speed up your editing. Press '?' anytime to see all shortcuts.",
    features: [
      { name: "Playback", description: "Space (play/pause), ←/→ (frame step), Shift+←/→ (1 sec jump), Home (start), End (end)." },
      { name: "Editing", description: "Delete/Backspace (remove clip), Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo), Ctrl+C (copy), Ctrl+V (paste), Ctrl+D (duplicate), S (split), Ctrl+A (select all), Esc (deselect)." },
      { name: "Timeline", description: "T (add text clip), +/- (zoom in/out)." },
      { name: "View & File", description: "F (fullscreen), ? (show shortcuts), Ctrl+E (export), Ctrl+S (save project JSON), Ctrl+O (open project JSON)." },
    ],
  },
  {
    id: "project",
    title: "Project Management",
    icon: "📁",
    description: "Save and load your projects as JSON files.",
    features: [
      { name: "Save Project (Ctrl+S)", description: "Downloads a JSON file with your project settings, tracks, clips, and library (excluding blob URLs). Save anytime to backup your work." },
      { name: "Open Project (Ctrl+O)", description: "Upload a saved project JSON file. Restores project settings, tracks, clips, and library. Continue editing where you left off." },
      { name: "Project Name", description: "Editable in the header. Used as filename for exports and saves." },
      { name: "Demo Project", description: "Click 'Demo' button to load a sample project. Includes 2 text clips with animations, 1 sticker, full 8-second timeline." },
    ],
  },
  {
    id: "tips",
    title: "Tips & Tricks",
    icon: "💡",
    description: "Pro tips for better videos.",
    features: [
      { name: "Layer Animations", description: "Combine entrance + continuous + keyframes for rich motion. e.g., Text fades in (entrance) + pulses (continuous) + moves across (keyframes)." },
      { name: "Use Transitions Wisely", description: "Don't overuse transitions. 'Fade' and 'Dissolve' are timeless. 'Glitch' and 'Flash' are great for energetic content but tiring if overused." },
      { name: "Match Music to Cuts", description: "Place audio clips first, then add video cuts on beat. Use 'Split' (S) to cut clips at music beats." },
      { name: "Use Keyframes for Motion", description: "Set 2 keyframes (start + end) for position to make text/stickers slide across the screen. Adjust easing for natural motion." },
      { name: "Vertical for Reels", description: "Set aspect ratio to 9:16 (1080x1920) before exporting for Instagram Reels, TikTok, YouTube Shorts." },
      { name: "Save Often", description: "Press Ctrl+S to save project JSON. Crash-safe your work. Reopen with Ctrl+O anytime." },
      { name: "Try Different Themes", description: "Switch between Holiday and Pro themes to see which you prefer. Doesn't affect your project, just the UI." },
      { name: "Use Sticker Bounce", description: "Default sticker animation 'Bounce' is great for celebrations. Try 'Float' for serene moods, 'Rotate' for playfulness." },
    ],
  },
];
