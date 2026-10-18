'use client';
// Transition panel - select transitions for selected clip's in/out
import { useEditorStore } from "@/lib/editor/store";
import { TRANSITION_PRESETS } from "@/lib/editor/constants";
import type { AnyClip, TransitionConfig, TransitionKind } from "@/lib/editor/types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function TransitionPanel() {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const findClip = useEditorStore((s) => s.findClip);
  const updateClip = useEditorStore((s) => s.updateClip);

  const clip = selectedClipId ? findClip(selectedClipId) : undefined;
  if (!clip) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" /> Transitions
        </h3>
        <p className="text-xs text-muted-foreground text-center py-6">
          Select a clip to apply transitions
        </p>
      </div>
    );
  }

  const setIn = (kind: TransitionKind, duration: number) => {
    const tc: TransitionConfig = { kind, duration };
    updateClip(clip.id, { transitionIn: tc } as any);
    toast.success(`Transition in: ${TRANSITION_PRESETS.find(t => t.value === kind)?.label}`);
  };

  const setOut = (kind: TransitionKind, duration: number) => {
    const tc: TransitionConfig = { kind, duration };
    updateClip(clip.id, { transitionOut: tc } as any);
    toast.success(`Transition out: ${TRANSITION_PRESETS.find(t => t.value === kind)?.label}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <ArrowLeftRight className="w-4 h-4" /> Transitions
      </h3>

      {/* In transition */}
      <div className="border border-border rounded p-2">
        <Label className="text-[10px] uppercase text-muted-foreground">Transition In (Entrance)</Label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {TRANSITION_PRESETS.map((t) => (
            <button
              key={t.value}
              onClick={() => setIn(t.value, t.defaultDuration)}
              className={`text-[10px] px-1 py-1.5 rounded border ${clip.transitionIn?.kind === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {clip.transitionIn && clip.transitionIn.kind !== "none" && (
          <div className="mt-2">
            <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
              <span>Duration</span><span>{clip.transitionIn.duration.toFixed(2)}s</span>
            </Label>
            <Slider
              value={[clip.transitionIn.duration]}
              min={0.1}
              max={3}
              step={0.05}
              onValueChange={(v) => setIn(clip.transitionIn!.kind, v[0])}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Out transition */}
      <div className="border border-border rounded p-2">
        <Label className="text-[10px] uppercase text-muted-foreground">Transition Out (Exit)</Label>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {TRANSITION_PRESETS.map((t) => (
            <button
              key={t.value}
              onClick={() => setOut(t.value, t.defaultDuration)}
              className={`text-[10px] px-1 py-1.5 rounded border ${clip.transitionOut?.kind === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {clip.transitionOut && clip.transitionOut.kind !== "none" && (
          <div className="mt-2">
            <Label className="text-[10px] uppercase text-muted-foreground flex justify-between">
              <span>Duration</span><span>{clip.transitionOut.duration.toFixed(2)}s</span>
            </Label>
            <Slider
              value={[clip.transitionOut.duration]}
              min={0.1}
              max={3}
              step={0.05}
              onValueChange={(v) => setOut(clip.transitionOut!.kind, v[0])}
              className="mt-1"
            />
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Transitions occur between adjacent clips on the same track.
      </p>
    </div>
  );
}
