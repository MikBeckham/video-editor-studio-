'use client';
// Sticker panel - emojis & shapes
import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { STICKER_CATEGORIES } from "@/lib/editor/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function StickerPanel() {
  const [category, setCategory] = useState(STICKER_CATEGORIES[0].name);
  const tracks = useEditorStore((s) => s.tracks);
  const playhead = useEditorStore((s) => s.playhead);
  const addClip = useEditorStore((s) => s.addClip);
  const createStickerClip = useEditorStore((s) => s.createStickerClip);

  const addSticker = (emoji: string) => {
    let track = tracks.find((t) => t.kind === "sticker");
    if (!track) track = tracks[0];
    if (!track) return;
    const clip = createStickerClip(emoji, track.id, playhead);
    addClip(clip);
    toast.success("Sticker added");
  };

  const current = STICKER_CATEGORIES.find((c) => c.name === category) ?? STICKER_CATEGORIES[0];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Stickers & Emojis</h3>
      <div className="flex flex-wrap gap-1">
        {STICKER_CATEGORIES.map((c) => (
          <button
            key={c.name}
            onClick={() => setCategory(c.name)}
            className={`px-2 py-1 rounded text-[10px] ${category === c.name ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ScrollArea className="h-[420px]">
        <div className="grid grid-cols-5 gap-1">
          {current.items.map((emoji, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify({ kind: "sticker", payload: emoji }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => addSticker(emoji)}
              className="aspect-square text-2xl flex items-center justify-center hover:bg-accent rounded transition cursor-grab active:cursor-grabbing"
              title="Drag to timeline or click to add"
            >
              {emoji}
            </div>
          ))}
        </div>
      </ScrollArea>
      <p className="text-[10px] text-muted-foreground">Drag an emoji to timeline or click to add as a sticker</p>
    </div>
  );
}
