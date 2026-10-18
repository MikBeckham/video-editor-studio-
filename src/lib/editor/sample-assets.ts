// Sample assets for the editor (using data URLs so they work offline)
import type { MediaSource } from "./types";

// SVG-based sample backgrounds (encoded as data URLs)
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${typeof window !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64")}`;
}

const sampleSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1931"/><stop offset="0.5" stop-color="#132a5a"/><stop offset="1" stop-color="#FFD700"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><circle cx="300" cy="200" r="60" fill="#FFD700" opacity="0.6"/><circle cx="1600" cy="800" r="120" fill="#FFFFFF" opacity="0.3"/><text x="960" y="540" font-family="Arial" font-size="120" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Sample Video</text></svg>`;

const sampleSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF006E"/><stop offset="1" stop-color="#8338EC"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g2)"/><circle cx="960" cy="540" r="300" fill="none" stroke="#FFD700" stroke-width="20" opacity="0.8"/><circle cx="960" cy="540" r="200" fill="none" stroke="#FFFFFF" stroke-width="10" opacity="0.5"/><text x="960" y="900" font-family="Arial" font-size="60" font-weight="bold" fill="#FFD700" text-anchor="middle">Scene 2</text></svg>`;

const sampleSvg3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><defs><radialGradient id="g3" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#FFC6AC"/><stop offset="1" stop-color="#0a1931"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#g3)"/><polygon points="960,200 1100,500 1400,500 1160,680 1240,980 960,800 680,980 760,680 520,500 820,500" fill="#FFD700"/><text x="960" y="540" font-family="Arial" font-size="80" font-weight="bold" fill="#0a1931" text-anchor="middle">STAR</text></svg>`;

const sampleSvg4 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920"><defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06FFA5"/><stop offset="1" stop-color="#03045E"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g4)"/><circle cx="540" cy="960" r="400" fill="none" stroke="#FFD700" stroke-width="40"/><text x="540" y="1050" font-family="Arial" font-size="120" font-weight="bold" fill="#FFFFFF" text-anchor="middle">REEL</text><text x="540" y="200" font-family="Arial" font-size="40" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Vertical 9:16</text></svg>`;

export const SAMPLE_IMAGES: MediaSource[] = [
  { id: "sample-img-1", kind: "image", url: svgToDataUrl(sampleSvg1), name: "Holiday Gradient", width: 1920, height: 1080, isSample: true },
  { id: "sample-img-2", kind: "image", url: svgToDataUrl(sampleSvg2), name: "Pink Purple", width: 1920, height: 1080, isSample: true },
  { id: "sample-img-3", kind: "image", url: svgToDataUrl(sampleSvg3), name: "Star Burst", width: 1920, height: 1080, isSample: true },
  { id: "sample-img-4", kind: "image", url: svgToDataUrl(sampleSvg4), name: "Vertical Reel BG", width: 1080, height: 1920, isSample: true },
];

// Simple "video" samples - SVG with animation, treated as videos in the editor.
// We'll use WebM-style data URL placeholders if available, otherwise treat as image.
const animatedSvg = (color1: string, color2: string, label: string, w = 1920, h = 1080) => svgToDataUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color1}"/><stop offset="1" stop-color="${color2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"><animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/></rect><text x="${w/2}" y="${h/2}" font-family="Arial" font-size="${Math.floor(w/16)}" font-weight="bold" fill="#FFFFFF" text-anchor="middle" opacity="0.9">${label}</text></svg>`
);

export const SAMPLE_VIDEOS: MediaSource[] = [
  { id: "sample-vid-1", kind: "video", url: animatedSvg("#0a1931", "#FFD700", "Sample Animated 1"), name: "Animated Holiday", duration: 8, width: 1920, height: 1080, isSample: true },
  { id: "sample-vid-2", kind: "video", url: animatedSvg("#FF006E", "#8338EC", "Sample Animated 2"), name: "Pink Purple Flow", duration: 8, width: 1920, height: 1080, isSample: true },
  { id: "sample-vid-3", kind: "video", url: animatedSvg("#06FFA5", "#03045E", "Vertical Sample", 1080, 1920), name: "Vertical Animated", duration: 8, width: 1080, height: 1920, isSample: true },
];

// Audio samples - generated Web Audio API oscillators at runtime (no file needed)
// For simplicity we'll generate sine wave audio data on demand.
export const SAMPLE_AUDIO: MediaSource[] = [
  // Audio samples will be synthesized at runtime by user clicking "Generate Tone"
];

// Stock videos - we'll use external Pexels CDN URLs (these are real public-domain clips)
export const STOCK_VIDEOS: MediaSource[] = [
  // Pexels provides free stock videos; we list a few sample URLs.
  // The user can also upload their own.
];

export const SAMPLE_STOCK_LIBRARY = {
  backgrounds: [
    { url: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Beach Sunset", kind: "image" as const },
    { url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "River Rocks", kind: "image" as const },
    { url: "https://images.pexels.com/photos/235621/pexels-photo-235621.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Forest", kind: "image" as const },
    { url: "https://images.pexels.com/photos/361750/pexels-photo-361750.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Mountain", kind: "image" as const },
    { url: "https://images.pexels.com/photos/355465/pexels-photo-355465.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "City Sky", kind: "image" as const },
    { url: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Coffee", kind: "image" as const },
    { url: "https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Flowers", kind: "image" as const },
    { url: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1920", name: "Snow", kind: "image" as const },
  ],
};
