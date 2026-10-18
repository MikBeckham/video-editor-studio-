'use client';
// Text panel - templates, fonts, colors, presets
import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import {
  TEXT_PRESET_TEMPLATES,
  FONT_FAMILIES,
  COLOR_PALETTE,
  TEXT_STYLE_PRESETS,
  DEFAULT_TEXT_STYLE,
} from "@/lib/editor/constants";
import type { TextClip } from "@/lib/editor/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function TextPanel() {
  const [activeTab, setActiveTab] = useState("templates");
  const [text, setText] = useState("Your Text Here");
  const tracks = useEditorStore((s) => s.tracks);
  const addClip = useEditorStore((s) => s.addClip);
  const playhead = useEditorStore((s) => s.playhead);
  const createTextClip = useEditorStore((s) => s.createTextClip);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const findClip = useEditorStore((s) => s.findClip);
  const updateClip = useEditorStore((s) => s.updateClip);

  const selectedText = selectedClipId ? findClip(selectedClipId) as TextClip | undefined : undefined;

  const addText = (text: string, style: any) => {
    // Find first text track or create
    let textTrack = tracks.find((t) => t.kind === "text");
    if (!textTrack) {
      // Use the first available track
      textTrack = tracks[0];
    }
    if (!textTrack) {
      toast.error("No text track available");
      return;
    }
    const clip = createTextClip(text || "Text", style, textTrack.id, playhead);
    addClip(clip);
    toast.success("Text added");
  };

  const updateText = (patch: Partial<TextClip>) => {
    if (!selectedText) return;
    updateClip(selectedText.id, patch);
  };

  const updateStyle = (patch: any) => {
    if (!selectedText) return;
    updateClip(selectedText.id, { style: { ...selectedText.style, ...patch } });
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span className="font-bold">Aa</span> Text & Captions
      </h3>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 h-auto">
          <TabsTrigger value="templates" className="text-[10px] py-1">Templates</TabsTrigger>
          <TabsTrigger value="custom" className="text-[10px] py-1">Custom</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-3">
          <ScrollArea className="h-[420px]">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Drag to timeline or click to add</p>
              {TEXT_PRESET_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.name}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/json", JSON.stringify({
                      kind: "text",
                      payload: { text: tpl.text, style: { ...DEFAULT_TEXT_STYLE, ...tpl.style, fontSize: tpl.fontSize ?? tpl.style.fontSize } },
                    }));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => addText(tpl.text, { ...DEFAULT_TEXT_STYLE, ...tpl.style, fontSize: tpl.fontSize ?? tpl.style.fontSize })}
                  className="group flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary hover:bg-accent/40 transition text-left cursor-grab active:cursor-grabbing"
                >
                  <div
                    className="flex-1 truncate text-base font-semibold"
                    style={{
                      color: tpl.style.color,
                      textShadow: tpl.style.shadow ? `0 2px 6px ${tpl.style.shadowColor ?? "#000"}` : undefined,
                      WebkitTextStroke: tpl.style.strokeWidth ? `${tpl.style.strokeWidth}px ${tpl.style.strokeColor}` : undefined,
                    }}
                  >
                    {tpl.text}
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="custom" className="mt-3">
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-xs">Text Content</Label>
              <Input
                value={selectedText ? selectedText.text : text}
                onChange={(e) => selectedText ? updateText({ text: e.target.value, name: e.target.value.slice(0, 24) }) : setText(e.target.value)}
                placeholder="Enter your text"
                className="mt-1 h-8"
              />
            </div>
            <Button
              size="sm"
              onClick={() => addText(text, { ...DEFAULT_TEXT_STYLE, preset: "clean" })}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Text
            </Button>

            {selectedText && (
              <div className="border-t border-border pt-3 mt-2">
                <p className="text-xs font-semibold mb-2">Edit Selected Text</p>
                <div className="flex flex-col gap-3">
                  {/* Style Presets */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Style Preset</Label>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {TEXT_STYLE_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => updateStyle(p.apply(selectedText.style))}
                          className={`text-[11px] px-2 py-1.5 rounded border ${selectedText.style.preset === p.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Font Family</Label>
                    <select
                      value={selectedText.style.fontFamily}
                      onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                      className="w-full mt-1 h-8 px-2 bg-background border border-border rounded text-xs"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                      <span>Font Size</span><span>{selectedText.style.fontSize}px</span>
                    </Label>
                    <Slider
                      value={[selectedText.style.fontSize]}
                      min={12}
                      max={240}
                      step={1}
                      onValueChange={(v) => updateStyle({ fontSize: v[0] })}
                      className="mt-1"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Font Weight</Label>
                    <select
                      value={selectedText.style.fontWeight}
                      onChange={(e) => updateStyle({ fontWeight: Number(e.target.value) })}
                      className="w-full mt-1 h-8 px-2 bg-background border border-border rounded text-xs"
                    >
                      <option value={300}>Light</option>
                      <option value={400}>Regular</option>
                      <option value={500}>Medium</option>
                      <option value={600}>SemiBold</option>
                      <option value={700}>Bold</option>
                      <option value={800}>ExtraBold</option>
                      <option value={900}>Black</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedText.style.color}
                        onChange={(e) => updateStyle({ color: e.target.value })}
                        className="h-8 w-10 border border-border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedText.style.color}
                        onChange={(e) => updateStyle({ color: e.target.value })}
                        className="flex-1 h-8 px-2 bg-background border border-border rounded text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-10 gap-1 mt-1.5">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateStyle({ color: c })}
                          className="aspect-square rounded border border-border"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stroke */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                      <span>Stroke Width</span><span>{selectedText.style.strokeWidth}px</span>
                    </Label>
                    <Slider
                      value={[selectedText.style.strokeWidth]}
                      min={0}
                      max={10}
                      step={0.5}
                      onValueChange={(v) => updateStyle({ strokeWidth: v[0] })}
                      className="mt-1"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <Label className="text-[10px]">Color</Label>
                      <input
                        type="color"
                        value={selectedText.style.strokeColor}
                        onChange={(e) => updateStyle({ strokeColor: e.target.value })}
                        className="h-6 w-8 border border-border rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                      <span>Background Opacity</span><span>{Math.round(selectedText.style.backgroundOpacity * 100)}%</span>
                    </Label>
                    <Slider
                      value={[selectedText.style.backgroundOpacity]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(v) => updateStyle({ backgroundOpacity: v[0] })}
                      className="mt-1"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <Label className="text-[10px]">BG Color</Label>
                      <input
                        type="color"
                        value={selectedText.style.backgroundColor === "transparent" ? "#000000" : selectedText.style.backgroundColor}
                        onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                        className="h-6 w-8 border border-border rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Toggle: shadow, italic, uppercase */}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedText.style.shadow}
                        onChange={(e) => updateStyle({ shadow: e.target.checked })}
                      />
                      Shadow
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedText.style.italic}
                        onChange={(e) => updateStyle({ italic: e.target.checked })}
                      />
                      Italic
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedText.style.uppercase}
                        onChange={(e) => updateStyle({ uppercase: e.target.checked })}
                      />
                      UPPERCASE
                    </label>
                  </div>

                  {/* Shadow color */}
                  {selectedText.style.shadow && (
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px]">Shadow Color</Label>
                      <input
                        type="color"
                        value={selectedText.style.shadowColor}
                        onChange={(e) => updateStyle({ shadowColor: e.target.value })}
                        className="h-6 w-8 border border-border rounded cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Letter spacing & line height */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                      <span>Letter Spacing</span><span>{selectedText.style.letterSpacing}px</span>
                    </Label>
                    <Slider
                      value={[selectedText.style.letterSpacing]}
                      min={-5}
                      max={20}
                      step={0.5}
                      onValueChange={(v) => updateStyle({ letterSpacing: v[0] })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                      <span>Line Height</span><span>{selectedText.style.lineHeight.toFixed(2)}</span>
                    </Label>
                    <Slider
                      value={[selectedText.style.lineHeight]}
                      min={0.6}
                      max={2.5}
                      step={0.05}
                      onValueChange={(v) => updateStyle({ lineHeight: v[0] })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
