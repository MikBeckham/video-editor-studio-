'use client';
// Inspector panel - properties of selected clip (animations, keyframes, transforms)
import { useState } from "react";
import { useEditorStore } from "@/lib/editor/store";
import {
  ENTRANCE_ANIMATIONS,
  EXIT_ANIMATIONS,
  CONTINUOUS_ANIMATIONS,
} from "@/lib/editor/constants";
import type { AnyClip, AnimationPresetKind, ContinuousAnimKind, Keyframe } from "@/lib/editor/types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  RotateCw,
  Move,
  Trash2,
  Plus,
  Film,
  Image as ImageIcon,
  Music2,
  Type as TypeIcon,
  Smile,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

const CLIP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Film,
  audio: Music2,
  text: TypeIcon,
  sticker: Smile,
};

export default function InspectorPanel({ className }: { className?: string }) {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const findClip = useEditorStore((s) => s.findClip);
  const updateClip = useEditorStore((s) => s.updateClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const playhead = useEditorStore((s) => s.playhead);
  const [activeTab, setActiveTab] = useState("animations");

  const clip = selectedClipId ? findClip(selectedClipId) : undefined;

  if (!clip) {
    return (
      <div className={`flex flex-col h-full bg-card/40 border-l border-border p-3 ${className ?? ""}`}>
        <h3 className="text-sm font-semibold mb-2">Inspector</h3>
        <div className="flex-1 flex items-center justify-center text-center p-6 text-muted-foreground text-xs">
          <div>
            <Move className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Select a clip to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = CLIP_ICON[clip.kind] || Film;
  const update = (patch: Partial<AnyClip>) => updateClip(clip.id, patch);

  const addKeyframe = (t: number) => {
    const kf: Keyframe = {
      id: nanoid(),
      t,
      props: { x: clip.x, y: clip.y, scale: clip.scale, rotation: clip.rotation, opacity: clip.opacity },
      ease: "easeInOut",
    };
    update({ keyframes: [...clip.keyframes, kf] });
    toast.success("Keyframe added");
  };

  const updateKeyframe = (id: string, patch: Partial<Keyframe>) => {
    update({ keyframes: clip.keyframes.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  };

  const removeKeyframe = (id: string) => {
    update({ keyframes: clip.keyframes.filter((k) => k.id !== id) });
  };

  return (
    <div className={`flex flex-col h-full bg-card/40 border-l border-border ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{clip.name || "Untitled"}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{clip.kind} clip</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => removeClip(clip.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 h-auto rounded-none bg-transparent border-b border-border">
          <TabsTrigger value="animations" className="text-[10px] py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Animate
          </TabsTrigger>
          <TabsTrigger value="transform" className="text-[10px] py-1.5">
            <Move className="w-3.5 h-3.5 mr-1" /> Transform
          </TabsTrigger>
          <TabsTrigger value="keyframes" className="text-[10px] py-1.5">
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Keys
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="animations" className="m-0 p-3">
            <div className="flex flex-col gap-3">
              {/* Entrance */}
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Entrance Animation</Label>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  {ENTRANCE_ANIMATIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => update({ entrance: a.value as AnimationPresetKind })}
                      className={`text-[10px] px-2 py-1.5 rounded border ${clip.entrance === a.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exit */}
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Exit Animation</Label>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  {EXIT_ANIMATIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => update({ exit: a.value as AnimationPresetKind })}
                      className={`text-[10px] px-2 py-1.5 rounded border ${clip.exit === a.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continuous */}
              <div className="border-t border-border pt-2">
                <Label className="text-[10px] uppercase text-muted-foreground">Continuous Loop</Label>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  {CONTINUOUS_ANIMATIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => update({ continuous: a.value as ContinuousAnimKind })}
                      className={`text-[10px] px-2 py-1.5 rounded border ${clip.continuous === a.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
                Animations automatically play with the clip on the timeline.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="transform" className="m-0 p-3">
            <div className="flex flex-col gap-3">
              <AdjSlider label="Position X" value={clip.x} min={0} max={1} step={0.01} onChange={(v) => update({ x: v })} format={(v) => `${Math.round(v*100)}%`} />
              <AdjSlider label="Position Y" value={clip.y} min={0} max={1} step={0.01} onChange={(v) => update({ y: v })} format={(v) => `${Math.round(v*100)}%`} />
              <AdjSlider label="Scale" value={clip.scale} min={0.1} max={3} step={0.05} onChange={(v) => update({ scale: v })} format={(v) => `${v.toFixed(2)}×`} />
              <AdjSlider label="Rotation" value={clip.rotation} min={-180} max={180} step={1} onChange={(v) => update({ rotation: v })} format={(v) => `${v}°`} />
              <AdjSlider label="Opacity" value={clip.opacity} min={0} max={1} step={0.01} onChange={(v) => update({ opacity: v })} format={(v) => `${Math.round(v*100)}%`} />

              <div className="border-t border-border pt-2">
                <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
                  <span>Start</span><span>{clip.start.toFixed(2)}s</span>
                </Label>
                <Slider value={[clip.start]} min={0} max={120} step={0.05} onValueChange={(v) => update({ start: v[0] })} className="mt-1" />
                <Label className="text-[10px] uppercase text-muted-foreground flex justify-between mt-2">
                  <span>End</span><span>{clip.end.toFixed(2)}s</span>
                </Label>
                <Slider value={[clip.end]} min={0.1} max={120} step={0.05} onValueChange={(v) => update({ end: v[0] })} className="mt-1" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keyframes" className="m-0 p-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground mb-1">
                Add keyframes at the current playhead to animate position, scale, rotation, opacity over time.
              </p>
              <Button size="sm" onClick={() => addKeyframe(playhead - clip.start)} className="gap-2">
                <Plus className="w-3.5 h-3.5" /> Add Keyframe @ {playhead.toFixed(2)}s
              </Button>

              {clip.keyframes.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">No keyframes yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {[...clip.keyframes].sort((a, b) => a.t - b.t).map((kf) => (
                    <div key={kf.id} className="border border-border rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono">t={kf.t.toFixed(2)}s</span>
                        <button onClick={() => removeKeyframe(kf.id)} className="text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <KfSlider label="X" value={kf.props.x ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => updateKeyframe(kf.id, { props: { ...kf.props, x: v } })} format={(v) => `${Math.round(v*100)}%`} />
                        <KfSlider label="Y" value={kf.props.y ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => updateKeyframe(kf.id, { props: { ...kf.props, y: v } })} format={(v) => `${Math.round(v*100)}%`} />
                        <KfSlider label="Scale" value={kf.props.scale ?? 1} min={0.1} max={3} step={0.05} onChange={(v) => updateKeyframe(kf.id, { props: { ...kf.props, scale: v } })} format={(v) => `${v.toFixed(2)}×`} />
                        <KfSlider label="Rotation" value={kf.props.rotation ?? 0} min={-180} max={180} step={1} onChange={(v) => updateKeyframe(kf.id, { props: { ...kf.props, rotation: v } })} format={(v) => `${v}°`} />
                        <KfSlider label="Opacity" value={kf.props.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => updateKeyframe(kf.id, { props: { ...kf.props, opacity: v } })} format={(v) => `${Math.round(v*100)}%`} />
                        <div className="flex gap-1">
                          {(["linear", "easeIn", "easeOut", "easeInOut"] as const).map((e) => (
                            <button
                              key={e}
                              onClick={() => updateKeyframe(kf.id, { ease: e })}
                              className={`flex-1 text-[9px] py-1 rounded border ${kf.ease === e ? "border-primary bg-primary/10" : "border-border"}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function AdjSlider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string; }) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
        <span>{label}</span><span>{format ? format(value) : value}</span>
      </Label>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="mt-1" />
    </div>
  );
}

function KfSlider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string; }) {
  return (
    <div>
      <Label className="text-[9px] uppercase text-muted-foreground flex justify-between">
        <span>{label}</span><span>{format ? format(value) : value}</span>
      </Label>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="mt-1 h-3" />
    </div>
  );
}
