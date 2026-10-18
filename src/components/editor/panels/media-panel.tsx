'use client';
// Media panel - upload, sample assets, webcam, stock library
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { SAMPLE_IMAGES, SAMPLE_VIDEOS, SAMPLE_STOCK_LIBRARY } from "@/lib/editor/sample-assets";
import type { MediaSource } from "@/lib/editor/types";
import {
  Upload,
  Camera,
  Trash2,
  Search,
  Film,
  Image as ImageIcon,
  Music2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export default function MediaPanel() {
  const [activeTab, setActiveTab] = useState("uploads");
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Film className="w-4 h-4" /> Media Library
      </h3>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 h-auto">
          <TabsTrigger value="uploads" className="text-[10px] py-1">Uploads</TabsTrigger>
          <TabsTrigger value="samples" className="text-[10px] py-1">Samples</TabsTrigger>
          <TabsTrigger value="stock" className="text-[10px] py-1">Stock</TabsTrigger>
          <TabsTrigger value="record" className="text-[10px] py-1">Record</TabsTrigger>
        </TabsList>
        <TabsContent value="uploads" className="mt-3"><UploadPanel /></TabsContent>
        <TabsContent value="samples" className="mt-3"><SamplesPanel /></TabsContent>
        <TabsContent value="stock" className="mt-3"><StockPanel /></TabsContent>
        <TabsContent value="record" className="mt-3"><RecordPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function UploadPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const library = useEditorStore((s) => s.mediaLibrary);
  const addMedia = useEditorStore((s) => s.addMedia);
  const removeMedia = useEditorStore((s) => s.removeMedia);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const fileArr = Array.from(files);
    for (let i = 0; i < fileArr.length; i++) {
      const f = fileArr[i];
      setProgress(`Processing ${i + 1}/${fileArr.length}: ${f.name}`);
      const url = URL.createObjectURL(f);
      const kind = f.type.startsWith("video") ? "video" : f.type.startsWith("image") ? "image" : f.type.startsWith("audio") ? "audio" : "image";
      let duration: number | undefined;
      let width: number | undefined;
      let height: number | undefined;
      if (kind === "video") {
        const v = document.createElement("video");
        v.src = url;
        await new Promise<void>((res) => {
          v.onloadedmetadata = () => {
            duration = v.duration;
            width = v.videoWidth;
            height = v.videoHeight;
            res();
          };
          v.onerror = () => res();
        });
      } else if (kind === "audio") {
        const a = new Audio();
        a.src = url;
        await new Promise<void>((res) => {
          a.onloadedmetadata = () => {
            duration = a.duration;
            res();
          };
          a.onerror = () => res();
        });
      } else if (kind === "image") {
        const img = new Image();
        img.src = url;
        await new Promise<void>((res) => {
          img.onload = () => { width = img.naturalWidth; height = img.naturalHeight; res(); };
          img.onerror = () => res();
        });
      }
      const src: MediaSource = {
        id: nanoid(),
        kind: kind as any,
        url,
        name: f.name,
        duration,
        width,
        height,
      };
      addMedia(src);
    }
    setUploading(false);
    setProgress("");
    toast.success(`Added ${files.length} file(s)`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-medium">Click or drag files</p>
        <p className="text-[10px] text-muted-foreground mt-1">Video, Image, Audio supported</p>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,image/*,audio/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
      {uploading && (
        <div className="flex items-center gap-2 p-2 rounded border border-border bg-card/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground truncate">{progress}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {library.length === 0 ? (
          <p className="col-span-3 text-xs text-muted-foreground text-center py-4">No media uploaded yet</p>
        ) : (
          library.map((m) => (
            <div
              key={m.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({ kind: "media", payload: m.id }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="group relative aspect-video rounded-md overflow-hidden border border-border bg-black/40 cursor-grab active:cursor-grabbing hover:border-primary/60 transition"
              title="Drag to timeline or click to preview"
            >
              {m.kind === "video" ? (
                <video src={m.url} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" />
              ) : m.kind === "image" ? (
                <img src={m.url} alt={m.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-emerald-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                <span className="text-[10px] px-2 text-center line-clamp-2">{m.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeMedia(m.id); }}
                className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 z-10"
                aria-label={`Remove ${m.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <p className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded pointer-events-none">
                {m.kind === "video" ? `${m.duration?.toFixed(1)}s` : m.kind}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SamplesPanel() {
  const library = useEditorStore((s) => s.mediaLibrary);
  const addMedia = useEditorStore((s) => s.addMedia);

  const allSamples = [...SAMPLE_VIDEOS, ...SAMPLE_IMAGES];

  const addSample = (src: MediaSource) => {
    if (library.find((m) => m.id === src.id)) {
      toast.info("Already in library");
      return;
    }
    const newSrc = { ...src, id: nanoid() };
    addMedia(newSrc);
    toast.success(`Added ${src.name}`);
    return newSrc.id;
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Pre-loaded samples - drag to timeline or click to add to library</p>
      <div className="grid grid-cols-2 gap-2">
        {allSamples.map((s) => {
          const existing = library.find((m) => m.url === s.url);
          const id = existing?.id;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => {
                // Use existing id or create new on drop
                const dropId = id ?? s.id;
                e.dataTransfer.setData("application/json", JSON.stringify({
                  kind: "media",
                  payload: dropId,
                  fallback: s, // for the timeline to add to library first if not exists
                }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => addSample(s)}
              className="group relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary transition cursor-grab active:cursor-grabbing"
            >
              <img src={s.url} alt={s.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] pointer-events-none">
                {id ? "Drag to Timeline" : "+ Add / Drag"}
              </div>
              <p className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded pointer-events-none">{s.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StockPanel() {
  const library = useEditorStore((s) => s.mediaLibrary);
  const addMedia = useEditorStore((s) => s.addMedia);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const addStock = (url: string, name: string) => {
    const existing = library.find((m) => m.url === url);
    if (existing) {
      toast.info(`${name} is already in your library`);
      return;
    }
    setLoading((s) => ({ ...s, [url]: true }));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const src: MediaSource = {
        id: nanoid(),
        kind: "image",
        url,
        name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        isSample: false,
      };
      addMedia(src);
      setLoading((s) => ({ ...s, [url]: false }));
      toast.success(`Added ${name}`);
    };
    img.onerror = () => {
      setLoading((s) => ({ ...s, [url]: false }));
      toast.error(`Failed to load ${name}`);
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Free stock images from Pexels - drag to timeline or click to add</p>
      <div className="grid grid-cols-2 gap-2">
        {SAMPLE_STOCK_LIBRARY.backgrounds.map((b, i) => {
          const existing = library.find((m) => m.url === b.url);
          const isLoading = loading[b.url];
          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({
                  kind: "media",
                  payload: existing?.id ?? "",
                  fallback: { id: "", kind: b.kind, url: b.url, name: b.name, isSample: false } as MediaSource,
                }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => addStock(b.url, b.name)}
              className="group relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary transition cursor-grab active:cursor-grabbing"
            >
              {!loaded[b.url] && (
                <div className="absolute inset-0 skeleton-shimmer" />
              )}
              <img
                src={b.url}
                alt={b.name}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
                onLoad={() => setLoaded((s) => ({ ...s, [b.url]: true }))}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] pointer-events-none">
                {existing ? "Drag to Timeline" : isLoading ? "Loading..." : "+ Add / Drag"}
              </div>
              <p className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded pointer-events-none">{b.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecordPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const addMedia = useEditorStore((s) => s.addMedia);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setPreviewStream(null);
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setPreviewStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
    } catch (e) {
      toast.error("Camera access denied");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const v = document.createElement("video");
      v.src = url;
      v.onloadedmetadata = () => {
        addMedia({
          id: nanoid(),
          kind: "video",
          url,
          name: `Recording ${new Date().toLocaleTimeString()}`,
          duration: v.duration,
          width: v.videoWidth,
          height: v.videoHeight,
        });
        toast.success("Recording added");
      };
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Record from webcam</p>
      <div className="aspect-video bg-black rounded-md overflow-hidden relative">
        {previewStream ? (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!previewStream ? (
          <Button size="sm" onClick={startPreview} className="flex-1 gap-2">
            <Camera className="w-3.5 h-3.5" /> Start Preview
          </Button>
        ) : !recording ? (
          <Button size="sm" onClick={startRecording} className="flex-1 gap-2 bg-red-600 hover:bg-red-700">
            <span className="w-2 h-2 rounded-full bg-white" /> Start Recording
          </Button>
        ) : (
          <Button size="sm" onClick={stopRecording} className="flex-1 gap-2">
            Stop Recording
          </Button>
        )}
        {previewStream && (
          <Button size="sm" variant="outline" onClick={stopStream}>Stop</Button>
        )}
      </div>
    </div>
  );
}
