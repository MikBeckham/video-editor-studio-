'use client';
// Recovery dialog — prompts user when an autosave is detected on reload
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, Trash2 } from "lucide-react";
import {
  applyAutosaveSnapshot,
  clearAutosave,
  getAutosaveHistory,
  type AutosaveSnapshot,
} from "@/lib/editor/autosave";
import { useEditorStore } from "@/lib/editor/store";
import { toast } from "sonner";

interface RecoveryDialogProps {
  snapshot: AutosaveSnapshot | null;
  onDismiss: () => void;
}

export default function RecoveryDialog({ snapshot, onDismiss }: RecoveryDialogProps) {
  const [showHistory, setShowHistory] = useState(false);
  if (!snapshot) return null;

  const clipCount = snapshot.tracks.reduce((acc, t) => acc + t.clips.length, 0);
  const dateStr = new Date(snapshot.timestamp).toLocaleString();
  const projectName = snapshot.project.name || "Untitled Project";

  const handleRecover = () => {
    applyAutosaveSnapshot(snapshot);
    toast.success(`Recovered "${projectName}" with ${clipCount} clips`);
    onDismiss();
  };

  const handleDiscard = () => {
    clearAutosave();
    toast.info("Autosave discarded");
    onDismiss();
  };

  const handleHistoryRecover = (snap: AutosaveSnapshot) => {
    applyAutosaveSnapshot(snap);
    toast.success("Restored from autosave history");
    setShowHistory(false);
    onDismiss();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Recover Your Work?
          </DialogTitle>
          <DialogDescription>
            An unsaved session was found from <strong>{dateStr}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between p-2 rounded bg-card/40 border border-border">
            <span className="text-muted-foreground">Project name</span>
            <span className="font-medium truncate max-w-[200px]">{projectName}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-card/40 border border-border">
            <span className="text-muted-foreground">Theme</span>
            <span className="font-medium capitalize">{snapshot.project.theme}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-card/40 border border-border">
            <span className="text-muted-foreground">Aspect ratio</span>
            <span className="font-medium">{snapshot.project.aspectRatio}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-card/40 border border-border">
            <span className="text-muted-foreground">Clips on timeline</span>
            <span className="font-medium">{clipCount}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-card/40 border border-border">
            <span className="text-muted-foreground">Tracks</span>
            <span className="font-medium">{snapshot.tracks.length}</span>
          </div>
        </div>

        {showHistory && <AutosaveHistoryList onPick={handleHistoryRecover} />}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button onClick={handleRecover} className="flex-1 gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Recover Now
            </Button>
            <Button variant="outline" onClick={handleDiscard} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> Discard
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="w-full text-xs">
            {showHistory ? "Hide history" : `Show all autosaves (${getAutosaveHistory().length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AutosaveHistoryList({ onPick }: { onPick: (snap: AutosaveSnapshot) => void }) {
  // Compute history once on mount — no setState-in-effect
  const [history] = useState<AutosaveSnapshot[]>(() => [...getAutosaveHistory()].reverse());
  return (
    <ScrollArea className="max-h-32 border border-border rounded">
      <div className="flex flex-col">
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No history</p>
        ) : (
          history.map((snap, i) => {
            const clipCount = snap.tracks.reduce((acc, t) => acc + t.clips.length, 0);
            return (
              <button
                key={i}
                onClick={() => onPick(snap)}
                className="flex items-center justify-between px-3 py-2 text-xs hover:bg-accent/40 border-b border-border last:border-0"
              >
                <span>{new Date(snap.timestamp).toLocaleString()}</span>
                <span className="text-muted-foreground">{clipCount} clips</span>
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
