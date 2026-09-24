"use client";

import { useEffect, useMemo, useState } from "react";
import { Film, Link2 } from "lucide-react";
import {
  isAllowedMoodboardEmbedUrl,
  youtubeEmbedUrl,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ceylonweddings/ui/components/dialog";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { cn } from "@ceylonweddings/ui/utils";

function providerLabel(url: string): "YouTube" | "Vimeo" | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtu")) return "YouTube";
    if (host.includes("vimeo")) return "Vimeo";
  } catch {
    return null;
  }
  return null;
}

export function MoodboardVideoModal({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setTouched(false);
    }
  }, [open]);

  const trimmed = url.trim();
  const allowed = trimmed.length > 0 && isAllowedMoodboardEmbedUrl(trimmed);
  const embed = useMemo(() => (allowed ? youtubeEmbedUrl(trimmed) : null), [allowed, trimmed]);
  const provider = allowed ? providerLabel(trimmed) : null;
  const invalid = touched && trimmed.length > 0 && !allowed;

  const insert = () => {
    if (!embed) return;
    onInsert(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(34rem,calc(100vw-1.5rem))] gap-5 border-[#e8ddd0] bg-[#fffaf5] text-[#1f1a16] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#b4532a]/12 text-[#b4532a]">
              <Film className="size-4" />
            </span>
            Add video
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Paste a YouTube or Vimeo link. Preview it here, then place it on the board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="moodboard-video-url">Video URL</Label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#5c4a3a]/55" />
            <Input
              id="moodboard-video-url"
              value={url}
              placeholder="https://www.youtube.com/watch?v=…"
              className="h-11 border-[#e8ddd0] bg-white pl-10 pr-24"
              autoFocus
              onChange={(e) => {
                setUrl(e.target.value);
                setTouched(true);
              }}
              onPaste={() => setTouched(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insert();
                }
              }}
            />
            {provider ? (
              <span
                className={cn(
                  "pointer-events-none absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  provider === "YouTube"
                    ? "bg-red-100 text-red-700"
                    : "bg-sky-100 text-sky-800",
                )}
              >
                <Film className="size-3" />
                {provider}
              </span>
            ) : null}
          </div>
          {invalid ? (
            <p className="text-xs text-destructive">Use a YouTube or Vimeo URL.</p>
          ) : (
            <p className="text-xs text-[#5c4a3a]/70">
              Supports youtube.com, youtu.be, and vimeo.com
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e8ddd0] bg-[#1f1a16] shadow-[inset_0_1px_0_rgba(255,250,245,0.06)]">
          {embed ? (
            <div className="aspect-video w-full">
              <iframe
                title="Video preview"
                src={embed}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/8">
                <Film className="size-6 text-[#fffaf5]/45" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#fffaf5]/80">Preview</p>
                <p className="max-w-[16rem] text-xs leading-relaxed text-[#fffaf5]/45">
                  Drop in a link and the embed will appear before you add it to the board.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!embed} onClick={insert}>
            Add to board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
