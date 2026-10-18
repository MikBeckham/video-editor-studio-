'use client';
// User Guide dialog - comprehensive feature documentation
import { useState, useMemo } from "react";
import { USER_GUIDE_SECTIONS } from "@/lib/editor/user-guide";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Book, Search, Download, X } from "lucide-react";

interface UserGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function UserGuideDialog({ open, onClose }: UserGuideDialogProps) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const filtered = useMemo(() => {
    if (!query.trim()) return USER_GUIDE_SECTIONS;
    const q = query.toLowerCase();
    return USER_GUIDE_SECTIONS.map((s) => ({
      ...s,
      features: s.features.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          (f.tips ?? []).some((t) => t.toLowerCase().includes(q))
      ),
    })).filter((s) => s.features.length > 0 || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  const downloadAsHTML = () => {
    const html = generateGuideHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-editor-user-guide.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5" /> User Guide — Video Editor
          </DialogTitle>
          <DialogDescription>
            Complete documentation of all features. Search or browse by category.
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search features... (e.g., 'transition', 'export', 'shortcut')"
              className="pl-8 h-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={downloadAsHTML} className="gap-2">
            <Download className="w-3.5 h-3.5" /> Download Guide
          </Button>
        </div>

        {/* Content area */}
        <div className="flex flex-1 min-h-0 gap-3 mt-3">
          {/* Sidebar - section list */}
          <div className="w-44 shrink-0 border-r border-border pr-2">
            <ScrollArea className="h-full max-h-[60vh]">
              <nav className="flex flex-col gap-0.5">
                {USER_GUIDE_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition ${
                      activeSection === s.id
                        ? "bg-primary/15 text-primary font-medium"
                        : "hover:bg-accent/40 text-foreground/80"
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="flex-1 truncate">{s.title}</span>
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>

          {/* Main content - feature list */}
          <ScrollArea className="flex-1 max-h-[60vh] pr-2">
            <div className="flex flex-col gap-4">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No features found for "{query}". Try a different search.
                </p>
              ) : (
                filtered.map((section) => (
                  <div
                    key={section.id}
                    id={section.id}
                    className={activeSection === section.id ? "block" : "block"}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{section.icon}</span>
                      <h2 className="text-base font-semibold">{section.title}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
                    <div className="flex flex-col gap-2">
                      {section.features.map((f) => (
                        <div
                          key={f.name}
                          className="border border-border rounded-md p-2.5 bg-card/40 hover:bg-card/60 transition"
                        >
                          <h3 className="text-sm font-semibold text-foreground mb-1">{f.name}</h3>
                          <p className="text-xs text-foreground/80 leading-relaxed">{f.description}</p>
                          {f.tips && f.tips.length > 0 && (
                            <ul className="mt-2 flex flex-col gap-1">
                              {f.tips.map((tip, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                                  <span className="text-primary shrink-0">→</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          <span>Press <kbd className="font-mono bg-muted border border-border rounded px-1 py-0.5">?</kbd> to see keyboard shortcuts</span>
          <span>{USER_GUIDE_SECTIONS.reduce((acc, s) => acc + s.features.length, 0)} features documented</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generate standalone HTML version of the guide for download
function generateGuideHTML(): string {
  const sections = USER_GUIDE_SECTIONS.map((section) => `
    <section class="category">
      <h2><span class="icon">${section.icon}</span> ${section.title}</h2>
      <p class="desc">${section.description}</p>
      <div class="features">
        ${section.features.map((f) => `
          <div class="feature">
            <h3>${f.name}</h3>
            <p>${f.description}</p>
            ${f.tips && f.tips.length ? `
              <ul class="tips">
                ${f.tips.map((t) => `<li>${t}</li>`).join("")}
              </ul>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");

  const totalFeatures = USER_GUIDE_SECTIONS.reduce((acc, s) => acc + s.features.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Video Editor - User Guide</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 40px 20px;
    background: #0f0f10;
    color: #e4e4e7;
    line-height: 1.6;
  }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { color: #FFD700; font-size: 32px; margin: 0 0 8px; }
  .subtitle { color: #a1a1aa; margin: 0 0 40px; font-size: 14px; }
  .category {
    margin-bottom: 48px;
    padding-bottom: 32px;
    border-bottom: 1px solid #27272a;
  }
  .category h2 {
    color: #ffffff;
    font-size: 22px;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .category .icon { font-size: 28px; }
  .category .desc { color: #a1a1aa; font-style: italic; margin: 0 0 20px; }
  .features { display: grid; gap: 12px; }
  .feature {
    background: #1c1c1e;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 16px;
  }
  .feature h3 { color: #FFD700; margin: 0 0 8px; font-size: 15px; }
  .feature p { margin: 0; font-size: 14px; color: #d4d4d8; }
  .tips {
    list-style: none;
    padding: 8px 0 0;
    margin: 8px 0 0;
    border-top: 1px dashed #27272a;
  }
  .tips li {
    font-size: 12px;
    color: #a1a1aa;
    margin: 4px 0;
    padding-left: 16px;
    position: relative;
  }
  .tips li::before {
    content: "→";
    color: #FFD700;
    position: absolute;
    left: 0;
  }
  kbd {
    background: #27272a;
    border: 1px solid #3f3f46;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 12px;
  }
  .stats {
    text-align: center;
    color: #71717a;
    font-size: 12px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #27272a;
  }
  @media print {
    body { background: white; color: black; padding: 20px; }
    .feature { background: #f9f9f9; border-color: #ddd; }
    .feature h3 { color: #b8860b; }
    .category h2 { color: black; }
    .category { border-bottom-color: #ddd; }
  }
</style>
</head>
<body>
  <div class="container">
    <h1>🎬 Video Editor — User Guide</h1>
    <p class="subtitle">Complete documentation of all features • Generated on ${new Date().toLocaleDateString()}</p>
    ${sections}
    <p class="stats">Total: ${USER_GUIDE_SECTIONS.length} sections • ${totalFeatures} features documented</p>
  </div>
</body>
</html>`;
}
