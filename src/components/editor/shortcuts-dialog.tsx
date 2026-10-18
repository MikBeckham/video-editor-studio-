'use client';
// Shortcuts help dialog
import { SHORTCUTS, SHORTCUT_CATEGORIES } from "@/lib/editor/shortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Keyboard } from "lucide-react";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these shortcuts. <span className="font-mono">Cmd</span> = <span className="font-mono">Ctrl</span> on Windows/Linux.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="flex flex-col gap-5 pr-2">
            {SHORTCUT_CATEGORIES.map((cat) => {
              const items = SHORTCUTS.filter((s) => s.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">{cat}</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((s) => (
                      <div
                        key={s.keys + s.description}
                        className="flex items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-accent/40"
                      >
                        <span className="text-xs text-foreground">{s.description}</span>
                        <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 min-w-[80px] text-center">
                          {s.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
