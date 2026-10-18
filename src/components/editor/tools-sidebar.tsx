'use client';
// Tools sidebar with all editor tool tabs
import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import {
  Film,
  Type as TypeIcon,
  Smile,
  Wand2,
  ArrowLeftRight,
  Music2,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaPanel from "./panels/media-panel";
import TextPanel from "./panels/text-panel";
import StickerPanel from "./panels/sticker-panel";
import FilterPanel from "./panels/filter-panel";
import TransitionPanel from "./panels/transition-panel";
import AudioPanel from "./panels/audio-panel";

interface ToolsSidebarProps {
  className?: string;
}

export default function ToolsSidebar({ className }: ToolsSidebarProps) {
  const [active, setActive] = useState("media");
  return (
    <div className={`flex flex-col h-full bg-card/40 border-r border-border ${className ?? ""}`}>
      <Tabs value={active} onValueChange={setActive} className="flex flex-col h-full flex-1">
        <TabsList className="grid grid-cols-7 gap-0.5 rounded-none bg-transparent h-auto p-1.5 border-b border-border">
          <TabsTrigger value="media" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <Film className="w-4 h-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="text" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <TypeIcon className="w-4 h-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="sticker" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <Smile className="w-4 h-4" />
            Sticker
          </TabsTrigger>
          <TabsTrigger value="filter" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <Sliders className="w-4 h-4" />
            Filter
          </TabsTrigger>
          <TabsTrigger value="transition" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <ArrowLeftRight className="w-4 h-4" />
            Trans
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <Music2 className="w-4 h-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex flex-col gap-0.5 py-1.5 px-0 text-[10px]">
            <Sparkles className="w-4 h-4" />
            Magic
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="media" className="m-0 p-3">
            <MediaPanel />
          </TabsContent>
          <TabsContent value="text" className="m-0 p-3">
            <TextPanel />
          </TabsContent>
          <TabsContent value="sticker" className="m-0 p-3">
            <StickerPanel />
          </TabsContent>
          <TabsContent value="filter" className="m-0 p-3">
            <FilterPanel />
          </TabsContent>
          <TabsContent value="transition" className="m-0 p-3">
            <TransitionPanel />
          </TabsContent>
          <TabsContent value="audio" className="m-0 p-3">
            <AudioPanel />
          </TabsContent>
          <TabsContent value="effects" className="m-0 p-3">
            <EffectsPanel />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function EffectsPanel() {
  // Reuse filter panel content with extra presets
  return <FilterPanel />;
}
