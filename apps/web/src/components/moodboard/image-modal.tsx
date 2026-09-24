"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ceylonweddings/ui/components/dialog";
import { cn } from "@ceylonweddings/ui/utils";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type MoodboardImagePick = {
  file: File;
  width: number;
  height: number;
};

function isAllowedImage(file: File) {
  return (ACCEPT as readonly string[]).includes(file.type);
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 320, height: img.naturalHeight || 240 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 320, height: 240 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function pickMoodboardImage(file: File): Promise<MoodboardImagePick | null> {
  if (!isAllowedImage(file)) return null;
  const size = await readImageSize(file);
  return { file, width: size.width, height: size.height };
}

export function fitMoodboardImage(width: number, height: number, max = 360) {
  if (width <= max && height <= max) return { width, height };
  const scale = max / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function MoodboardImageModal({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (pick: MoodboardImagePick) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSize(null);
    setError(null);
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const takeFile = useCallback(async (next: File | undefined) => {
    if (!next) return;
    if (!isAllowedImage(next)) {
      setError("Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    const dims = await readImageSize(next);
    setError(null);
    setFile(next);
    setSize(dims);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const image = [...(e.clipboardData?.files ?? [])].find(isAllowedImage);
      if (!image) return;
      e.preventDefault();
      void takeFile(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, takeFile]);

  const insert = () => {
    if (!file || !size) return;
    onInsert({ file, width: size.width, height: size.height });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(34rem,calc(100vw-1.5rem))] gap-5 border-[#e8ddd0] bg-[#fffaf5] text-[#1f1a16] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#b4532a]/12 text-[#b4532a]">
              <ImageIcon className="size-4" />
            </span>
            Add image
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Drop a photo, browse, or paste from the clipboard. Preview it before it goes on the board.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            void takeFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void takeFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "overflow-hidden rounded-xl border border-dashed text-left transition",
            dragging ? "border-[#b4532a] bg-[#b4532a]/8" : "border-[#e8ddd0] bg-white",
          )}
        >
          {preview && size ? (
            <div className="space-y-3 p-3">
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#1f1a16]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex items-center justify-between gap-3 px-1 text-xs text-[#5c4a3a]/75">
                <span className="truncate">{file?.name}</span>
                <span className="shrink-0 tabular-nums">
                  {size.width} × {size.height}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[#b4532a]/10 text-[#b4532a]">
                <Upload className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Drop an image here</p>
                <p className="max-w-[18rem] text-xs leading-relaxed text-[#5c4a3a]/70">
                  JPEG, PNG, WebP, or GIF. You can also paste with ⌘V.
                </p>
              </div>
            </div>
          )}
        </button>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!file} onClick={insert}>
            Add to board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
