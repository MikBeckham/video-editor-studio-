'use client';
// Audio panel - audio library + clip adjustments
import { useRef, useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import type { AudioClip } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Music2, Loader2, Trash2, Plus, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { MediaSource } from "@/lib/editor/types";

export default function AudioPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const library = useEditorStore((s) => s.mediaLibrary);
  const addMedia = useEditorStore((s) => s.addMedia);
  const removeMedia = useEditorStore((s) => s.removeMedia);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const addClip = useEditorStore((s) => s.addClip);
  const createAudioClip = useEditorStore((s) => s.createAudioClip);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const findClip = useEditorStore((s) => s.findClip);
  const updateClip = useEditorStore((s) => s.updateClip);

  const [generating, setGenerating] = useState(false);

  const audioFiles = library.filter((m) => m.kind === "audio");
  const selectedAudio = selectedClipId ? findClip(selectedClipId) as AudioClip | undefined : undefined;
  const isAudioClip = selectedAudio && selectedAudio.kind === "audio";

  const handleFiles = async (files: FileList) => {
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("audio")) continue;
      const url = URL.createObjectURL(f);
      const a = new Audio();
      a.src = url;
      await new Promise<void>((res) => {
        a.onloadedmetadata = () => res();
        a.onerror = () => res();
      });
      addMedia({
        id: nanoid(),
        kind: "audio",
        url,
        name: f.name,
        duration: a.duration,
      } as MediaSource);
    }
    toast.success(`Added ${files.length} audio file(s)`);
  };

  // Generate a tone using Web Audio API and add to library
  const generateTone = async (type: "beep" | "chime" | "music" | "drum") => {
    setGenerating(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = 44100;
      let duration = 3;
      if (type === "chime") duration = 2;
      if (type === "drum") duration = 1;
      if (type === "music") duration = 10;
      const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          let s = 0;
          if (type === "beep") {
            s = 0.3 * Math.sin(2 * Math.PI * 440 * t) * Math.exp(-3 * t);
          } else if (type === "chime") {
            s = 0.2 * (
              Math.sin(2 * Math.PI * 523.25 * t) +
              Math.sin(2 * Math.PI * 659.25 * t) +
              Math.sin(2 * Math.PI * 783.99 * t)
            ) * Math.exp(-1 * t);
          } else if (type === "drum") {
            // Kick drum-like
            const env = Math.exp(-10 * t);
            const f = 80 * Math.exp(-5 * t);
            s = 0.4 * env * Math.sin(2 * Math.PI * f * t);
            // noise
            s += 0.05 * env * (Math.random() * 2 - 1);
          } else if (type === "music") {
            // Loopable simple melodic pattern
            const notes = [261.63, 329.63, 392, 440, 392, 329.63, 261.63, 220];
            const nIdx = Math.floor(t * 2) % notes.length;
            const f = notes[nIdx];
            const env = Math.exp(-2 * ((t * 2) % 1));
            s = 0.15 * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t));
          }
          data[i] = Math.tanh(s * 1.5);
        }
      }
      // Encode to WAV
      const wav = audioBufferToWav(buffer);
      const blob = new Blob([wav], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      addMedia({
        id: nanoid(),
        kind: "audio",
        url,
        name: `Generated ${type}`,
        duration,
      } as MediaSource);
      toast.success(`Generated ${type} tone`);
    } finally {
      setGenerating(false);
    }
  };

  const addToTimeline = (src: MediaSource) => {
    let track = tracks.find((t) => t.kind === "audio");
    if (!track) track = tracks[0];
    if (!track) return;
    const clip = createAudioClip(src, track.id, playhead);
    addClip(clip);
    toast.success("Audio added");
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Music2 className="w-4 h-4" /> Audio
      </h3>

      {/* Upload */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-xs">Upload audio files</p>
        <p className="text-[10px] text-muted-foreground mt-1">MP3, WAV, M4A, OGG</p>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Generate tones */}
      <div>
        <Label className="text-[10px] uppercase text-muted-foreground">Generate Audio</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {(["beep", "chime", "drum", "music"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              onClick={() => generateTone(t)}
              disabled={generating}
              className="text-[10px] h-7 capitalize"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Library */}
      <div className="border-t border-border pt-2">
        <Label className="text-[10px] uppercase text-muted-foreground">Audio Library</Label>
        <ScrollArea className="h-[200px] mt-1.5">
          <div className="flex flex-col gap-1.5 pr-2">
            {audioFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No audio files</p>
            ) : (
              audioFiles.map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/json", JSON.stringify({ kind: "media", payload: a.id }));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center gap-2 p-2 rounded border border-border bg-card/40 hover:border-primary cursor-grab active:cursor-grabbing"
                  title="Drag to timeline"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs flex-1 truncate">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground">{a.duration?.toFixed(1)}s</span>
                  <button onClick={(e) => { e.stopPropagation(); addToTimeline(a); }} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 hover:bg-primary/40">+ Add</button>
                  <button onClick={(e) => { e.stopPropagation(); removeMedia(a.id); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Selected audio adjustments */}
      {isAudioClip && (
        <div className="border-t border-border pt-3 mt-1">
          <p className="text-xs font-semibold mb-2">Adjust Selected Audio</p>
          <div className="flex flex-col gap-2.5">
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                <span>Volume</span><span>{Math.round(selectedAudio!.volume * 100)}%</span>
              </Label>
              <Slider
                value={[selectedAudio!.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => updateClip(selectedAudio!.id, { volume: v[0] })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                <span>Fade In</span><span>{selectedAudio!.fadeIn.toFixed(2)}s</span>
              </Label>
              <Slider
                value={[selectedAudio!.fadeIn]}
                min={0}
                max={5}
                step={0.05}
                onValueChange={(v) => updateClip(selectedAudio!.id, { fadeIn: v[0] })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                <span>Fade Out</span><span>{selectedAudio!.fadeOut.toFixed(2)}s</span>
              </Label>
              <Slider
                value={[selectedAudio!.fadeOut]}
                min={0}
                max={5}
                step={0.05}
                onValueChange={(v) => updateClip(selectedAudio!.id, { fadeOut: v[0] })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                <span>Speed</span><span>{selectedAudio!.speed.toFixed(2)}×</span>
              </Label>
              <Slider
                value={[selectedAudio!.speed]}
                min={0.25}
                max={4}
                step={0.05}
                onValueChange={(v) => updateClip(selectedAudio!.id, { speed: v[0] })}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WAV encoder
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const bufferSize = 44 + dataSize;
  const ab = new ArrayBuffer(bufferSize);
  const view = new DataView(ab);
  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };
  writeString("RIFF");
  view.setUint32(offset, 36 + dataSize, true); offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true); offset += 4;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return ab;
}
