"use client";

import { Button } from "../components/button";
import { cn } from "../lib/utils";

export type CompareDockItem = {
  slug: string;
  name: string;
  photoUrl?: string | null;
};

export function VendorCompareDock({
  items,
  max = 3,
  message,
  onCompare,
  onClear,
  onRemove,
  className,
}: {
  items: CompareDockItem[];
  max?: number;
  message?: string | null;
  onCompare: () => void;
  onClear: () => void;
  onRemove: (slug: string) => void;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 shadow-[0_-10px_36px_rgba(0,0,0,0.14)] backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 md:px-6">
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/90">
            Compare · {items.length}/{max}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => onRemove(item.slug)}
                className="inline-flex max-w-[10rem] items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-2 py-1.5 text-left text-xs transition hover:border-destructive/40"
                title="Remove from compare"
              >
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="size-7 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="size-7 shrink-0 rounded-lg bg-secondary" />
                )}
                <span className="truncate font-medium">{item.name}</span>
                <span className="text-muted-foreground">×</span>
              </button>
            ))}
            {Array.from({ length: Math.max(0, max - items.length) }).map((_, index) => (
              <span
                key={`slot-${index}`}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-dashed border-border/70 text-xs text-muted-foreground"
              >
                +
              </span>
            ))}
          </div>
          {message ? <p className="text-xs text-destructive">{message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button type="button" size="sm" disabled={items.length < 2} onClick={onCompare}>
            Compare {items.length >= 2 ? `${items.length}` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
