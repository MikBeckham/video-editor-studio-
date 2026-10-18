'use client';
// Filter panel - presets & adjustments
import { useEditorStore } from "@/lib/editor/store";
import { FILTER_PRESETS, DEFAULT_ADJUSTMENTS } from "@/lib/editor/constants";
import type { VideoClip, FilterKind, FilterAdjustments } from "@/lib/editor/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FilterPanel() {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const findClip = useEditorStore((s) => s.findClip);
  const updateClip = useEditorStore((s) => s.updateClip);

  const clip = selectedClipId ? findClip(selectedClipId) as VideoClip | undefined : undefined;
  const isVideoClip = clip && clip.kind === "video";

  if (!isVideoClip) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Filters & Effects</h3>
        <p className="text-xs text-muted-foreground text-center py-6">
          Select a video or image clip to apply filters
        </p>
      </div>
    );
  }

  const v = clip as VideoClip;

  const setFilter = (kind: FilterKind, adjustments: FilterAdjustments) => {
    updateClip(v.id, { filters: kind, adjustments: { ...adjustments } });
    toast.success(`Filter: ${FILTER_PRESETS.find(f => f.value === kind)?.label}`);
  };

  const updateAdj = (patch: Partial<FilterAdjustments>) => {
    updateClip(v.id, { adjustments: { ...v.adjustments, ...patch } });
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Filters & Effects</h3>

      {/* Presets */}
      <div>
        <Label className="text-[10px] uppercase text-muted-foreground">Filter Presets</Label>
        <ScrollArea className="h-[260px] mt-2">
          <div className="grid grid-cols-3 gap-2 pr-2">
            {FILTER_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setFilter(p.value, p.adjustments)}
                className={`flex flex-col gap-1 p-1.5 rounded border ${v.filters === p.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
              >
                <div
                  className="aspect-video rounded"
                  style={{
                    background: "linear-gradient(135deg, #FF006E, #8338EC, #06FFA5)",
                    filter: adjustmentsToFilterStr(p.adjustments),
                  }}
                />
                <span className="text-[9px] text-center truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Adjustments */}
      <div className="border-t border-border pt-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">Manual Adjustments</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px]"
            onClick={() => updateAdj({ ...DEFAULT_ADJUSTMENTS })}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          <AdjSlider label="Brightness" value={v.adjustments.brightness} min={0.2} max={2} step={0.01} onChange={(v) => updateAdj({ brightness: v })} format={(v) => `${v.toFixed(2)}×`} />
          <AdjSlider label="Contrast" value={v.adjustments.contrast} min={0.2} max={2} step={0.01} onChange={(v) => updateAdj({ contrast: v })} format={(v) => `${v.toFixed(2)}×`} />
          <AdjSlider label="Saturation" value={v.adjustments.saturate} min={0} max={2.5} step={0.01} onChange={(v) => updateAdj({ saturate: v })} format={(v) => `${v.toFixed(2)}×`} />
          <AdjSlider label="Hue Rotate" value={v.adjustments.hueRotate} min={-180} max={180} step={1} onChange={(v) => updateAdj({ hueRotate: v })} format={(v) => `${v}°`} />
          <AdjSlider label="Blur" value={v.adjustments.blur} min={0} max={20} step={0.1} onChange={(v) => updateAdj({ blur: v })} format={(v) => `${v.toFixed(1)}px`} />
          <AdjSlider label="Grayscale" value={v.adjustments.grayscale} min={0} max={1} step={0.01} onChange={(v) => updateAdj({ grayscale: v })} format={(v) => `${Math.round(v*100)}%`} />
          <AdjSlider label="Sepia" value={v.adjustments.sepia} min={0} max={1} step={0.01} onChange={(v) => updateAdj({ sepia: v })} format={(v) => `${Math.round(v*100)}%`} />
          <AdjSlider label="Invert" value={v.adjustments.invert} min={0} max={1} step={0.01} onChange={(v) => updateAdj({ invert: v })} format={(v) => `${Math.round(v*100)}%`} />
          <AdjSlider label="Vignette" value={v.adjustments.vignette} min={0} max={1} step={0.01} onChange={(v) => updateAdj({ vignette: v })} format={(v) => `${Math.round(v*100)}%`} />
        </div>
      </div>

      {/* Transform */}
      <div className="border-t border-border pt-3 mt-2">
        <Label className="text-xs font-semibold mb-2 block">Transform</Label>
        <div className="flex flex-col gap-2.5">
          <AdjSlider label="Scale" value={v.scale} min={0.1} max={3} step={0.05} onChange={(val) => updateClip(v.id, { scale: val })} format={(v) => `${v.toFixed(2)}×`} />
          <AdjSlider label="Rotation" value={v.rotation} min={-180} max={180} step={1} onChange={(val) => updateClip(v.id, { rotation: val })} format={(v) => `${v}°`} />
          <AdjSlider label="Opacity" value={v.opacity} min={0} max={1} step={0.01} onChange={(val) => updateClip(v.id, { opacity: val })} format={(v) => `${Math.round(v*100)}%`} />
          <AdjSlider label="X Position" value={v.x} min={0} max={1} step={0.01} onChange={(val) => updateClip(v.id, { x: val })} format={(v) => `${Math.round(v*100)}%`} />
          <AdjSlider label="Y Position" value={v.y} min={0} max={1} step={0.01} onChange={(val) => updateClip(v.id, { y: val })} format={(v) => `${Math.round(v*100)}%`} />
          {v.kind === "video" && !v.isImage && (
            <>
              <AdjSlider label="Speed" value={v.speed} min={0.25} max={4} step={0.05} onChange={(val) => updateClip(v.id, { speed: val })} format={(v) => `${v.toFixed(2)}×`} />
              <AdjSlider label="Volume" value={v.volume} min={0} max={1} step={0.01} onChange={(val) => updateClip(v.id, { volume: val })} format={(v) => `${Math.round(v*100)}%`} />
            </>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-1 h-7 text-[10px]" onClick={() => updateClip(v.id, { flipH: !v.flipH })}>
              Flip H {v.flipH ? "✓" : ""}
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1 h-7 text-[10px]" onClick={() => updateClip(v.id, { flipV: !v.flipV })}>
              Flip V {v.flipV ? "✓" : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function adjustmentsToFilterStr(a: FilterAdjustments): string {
  return [
    `brightness(${a.brightness})`,
    `contrast(${a.contrast})`,
    `saturate(${a.saturate})`,
    `hue-rotate(${a.hueRotate}deg)`,
    `blur(${a.blur}px)`,
    `grayscale(${a.grayscale})`,
    `sepia(${a.sepia})`,
    `invert(${a.invert})`,
  ].join(" ");
}

function AdjSlider({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
        <span>{label}</span><span>{format ? format(value) : value}</span>
      </Label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="mt-1"
      />
    </div>
  );
}
