# 🎬 Video Editor Studio

> A premium, browser-based professional video editor built with Next.js 16, TypeScript, Zustand, and Canvas. Multi-track timeline, animations, transitions, filters, MP4/WebM/GIF export — all client-side, no server required.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-cyan?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

---

## ✨ Features

### 🎬 Multi-Track Timeline
- **4 track kinds**: Video, Audio, Text, Sticker (color-coded)
- **Drag-drop** sidebar items to timeline (HTML5 DnD)
- **Smart snapping** to playhead, clip edges, and 1-second grid (0.25s threshold)
- **Visual snap guide line** during drag
- **Trim handles** on clip edges
- **Split at playhead** (`S` key)
- **Multi-select** with Shift+click
- **Bulk delete** (Delete removes all selected)
- **Ripple delete** (Shift+Delete shifts later clips left)
- **Nudge clips** (Ctrl+←/→ for 1 frame, Ctrl+Shift+←/→ for 1 second)
- **Per-track**: Hide / Mute (audio) / Lock / Remove
- **Locked tracks actually prevent edits**
- **Zoom** in/out (+/- keys or buttons)

### ✨ Rich Animations
- **13 entrance animations**: Fade, Slide (L/R/U/D), Pop, Bounce, Typewriter, Zoom, Rotate, Flip, Blur
- **4 exit animations**: Fade Out, Pop Out, Zoom Out
- **7 continuous loops**: Pulse, Float, Rotate, Shake, Swing, Wobble, Bounce
- **Keyframe-based animation** with 4 easing curves: linear, easeIn, easeOut, easeInOut

### 🔀 18 Transitions
Fade, Dissolve, Slide (L/R/U/D), Zoom In/Out, Wipe (L/R/U/D), Circle, Diamond, Glitch, Flash, Blur — with adjustable duration.

### 🎨 14 Filter Presets + Manual Adjustments
Vivid, Warm, Cool, Vintage, B&W, Sepia, Noir, Dramatic, Fade, Dreamy, Vignette, Invert, Blur. Plus 9 manual adjustments: brightness, contrast, saturation, hue, blur, grayscale, sepia, invert, vignette.

### ✍️ Text & Captions
- **10 templates**: Title, Subtitle, Caption, Lower Third, Quote, Call Out, Holiday, Number, Button, Tag
- **10 style presets**: Clean, Bold, Neon Glow, 3D Block, Outline, Shadow, Kinetic, Holiday, Gradient, Fire
- **12 fonts**: Inter, Poppins, Montserrat, Bebas Neue, Anton, Playfair, etc.
- **Full styling**: color palette, stroke, shadow, background, letter-spacing, line-height, italic, uppercase

### 😄 160+ Stickers
8 categories: Emojis, Gestures, Hearts, Party, Stars, Nature, Symbols, Animals

### 🎵 Audio System
- Upload MP3/WAV/M4A/OGG
- Built-in tone generator: Beep, Chime, Drum, Music (via Web Audio API → WAV)
- Real-time **waveform visualization** on audio clips
- Per-clip volume, fade in/out, speed

### 💾 Multi-Format Export
- **3 formats**: MP4 (H.264), WebM (VP9), Animated GIF
- **2 methods**: MediaRecorder (fast, native) + FFmpeg.wasm (true H.264 MP4)
- **4 quality presets**: Low / Medium / High / Original
- **3 frame rates**: 24 / 30 / 60 FPS
- **5 aspect ratios**: 16:9, 9:16 (Reels), 1:1, 4:5, 21:9
- Live progress bar + preview before download

### 🎭 3 Themes
- **Studio** (default): Midnight navy + slate + blue accent
- **Holiday**: Gold + dark blue (original theme)
- **Pro**: Neutral slate/zinc (Adobe Premiere-style)

### 📖 Built-in User Guide
- 18 sections, 60+ features documented
- Live search filter
- Press `H` or `F1` to open
- Downloadable standalone HTML version

---

## ⌨️ Keyboard Shortcuts

| Category | Shortcut | Action |
|---|---|---|
| Playback | `Space` | Play/Pause |
| Playback | `← / →` | Step 1 frame |
| Playback | `Shift + ←/→` | Jump 1 second |
| Playback | `Home / End` | Jump to start/end |
| Editing | `Delete` | Delete selected clip(s) |
| Editing | `Shift + Delete` | Ripple delete |
| Editing | `Ctrl + Z` | Undo |
| Editing | `Ctrl + Y` or `Ctrl + Shift + Z` | Redo |
| Editing | `Ctrl + C / V` | Copy / Paste |
| Editing | `Ctrl + D` | Duplicate |
| Editing | `S` | Split at playhead |
| Editing | `Ctrl + A` | Select all on track |
| Editing | `Shift + Click` | Multi-select |
| Editing | `Esc` | Deselect / Close dialog |
| Timeline | `T` | Add text clip |
| Timeline | `Ctrl + ←/→` | Nudge clip 1 frame |
| Timeline | `Ctrl + Shift + ←/→` | Nudge clip 1 second |
| Timeline | `+ / -` | Zoom in/out |
| View | `F` | Fullscreen |
| View | `H` or `F1` | User Guide |
| View | `?` | Shortcuts help |
| File | `Ctrl + E` | Export dialog |
| File | `Ctrl + S` | Save project (JSON) |
| File | `Ctrl + O` | Open project (JSON) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh) (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/video-editor-studio.git
cd video-editor-studio

# Install dependencies (Bun recommended, also works with npm/yarn/pnpm)
bun install

# Start development server
bun run dev

# Open in browser
# → http://localhost:3000
```

### Build for Production

```bash
bun run build
bun run start
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **State** | Zustand (with undo/redo + clipboard) |
| **Rendering** | Canvas 2D + requestAnimationFrame |
| **UI Components** | shadcn/ui (New York style) + Tailwind CSS 4 |
| **Icons** | lucide-react |
| **Export** | MediaRecorder API + FFmpeg.wasm (UMD via CDN) + gif.js |
| **Audio** | Web Audio API (tone generation + waveform decoding) |
| **Database** | Prisma ORM + SQLite (for future persistence features) |

---

## 📁 Project Structure

```
video-editor-studio/
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind + custom scrollbars/focus rings/shimmer
│   │   ├── layout.tsx
│   │   └── page.tsx              # Main editor page (assembles all panels)
│   │
│   ├── components/
│   │   ├── ui/                   # 47 shadcn/ui components
│   │   └── editor/
│   │       ├── editor-header.tsx       # Top toolbar
│   │       ├── tools-sidebar.tsx       # 7-tab left sidebar
│   │       ├── preview-canvas.tsx      # Real-time canvas preview
│   │       ├── inspector-panel.tsx     # Right panel (Animate/Transform/Keys)
│   │       ├── timeline-panel.tsx      # Multi-track timeline + snapping
│   │       ├── export-dialog.tsx       # Export modal
│   │       ├── shortcuts-dialog.tsx
│   │       ├── user-guide-dialog.tsx
│   │       ├── waveform.tsx            # Audio waveform canvas
│   │       └── panels/
│   │           ├── media-panel.tsx     # Upload/Samples/Stock/Webcam
│   │           ├── text-panel.tsx      # Templates + custom styling
│   │           ├── sticker-panel.tsx   # 160+ emojis
│   │           ├── filter-panel.tsx    # 14 presets + adjustments
│   │           ├── transition-panel.tsx
│   │           └── audio-panel.tsx     # Upload + tone generator
│   │
│   ├── hooks/
│   │   └── use-editor-shortcuts.ts    # Global keyboard shortcuts
│   │
│   └── lib/
│       └── editor/
│           ├── types.ts            # All TypeScript types
│           ├── constants.ts        # All presets
│           ├── store.ts            # Zustand store
│           ├── render-utils.ts     # Easing/animation/transition/filter math
│           ├── renderer.ts         # Canvas rendering engine
│           ├── export-utils.ts      # MediaRecorder + FFmpeg.wasm + GIF
│           ├── sample-assets.ts
│           ├── shortcuts.ts
│           └── user-guide.ts
│
├── prisma/schema.prisma
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🎯 Try It Out

1. **Click "Demo"** in the header to load a sample project
2. **Press Space** to play — see animations in action
3. **Press `?`** to see all keyboard shortcuts
4. **Press `H`** for the comprehensive user guide
5. **Drag any asset** from the left sidebar to the timeline
6. **Click "Export"** (or `Ctrl+E`) to render your video

---

## 🌐 Browser Compatibility

Tested in:
- ✅ Chrome 120+
- ✅ Edge 120+
- ✅ Firefox 120+
- ✅ Safari 17+ (MP4 export support varies)

**Note**: FFmpeg.wasm loads ~25MB on first use. Some browsers require SharedArrayBuffer for multi-threaded FFmpeg (set COOP/COEP headers if needed).

---

## 📝 Project Phases Status

- ✅ **Phase 1 — Design**: 3 themes, scrollbars, focus rings, panel-resize cursors, loading skeletons, aria-labels
- ✅ **Phase 2 — Timeline**: Smart snapping, audio waveforms, track locking enforcement, multi-select, ripple delete, nudge, fixed undo/redo semantics
- ⏳ **Phase 3 — Project Management**: Autosave, IndexedDB, recovery (planned)
- ⏳ **Phase 4 — Video/Audio**: Improvements (planned)
- ⏳ **Phase 5 — Export**: Improvements (planned)
- ⏳ **Phase 6 — Advanced**: Captions, beat markers, templates (planned)
- ⏳ **Phase 7 — Testing**: Ongoing

---

## 📄 License

MIT License — feel free to use, modify, and distribute as you see fit.

---

## 🤝 Contributing

PRs welcome! This is an open-source project — fork it, improve it, send a pull request.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [lucide-react](https://lucide.dev/) for the icon set
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) for in-browser video transcoding
- [gif.js](https://github.com/jnordberg/gif.js) for animated GIF encoding
- [Pexels](https://www.pexels.com/) for the free stock photos

---

**Built with Next.js, TypeScript, and ❤️ — no API keys required, no backend, no paid dependencies.**
