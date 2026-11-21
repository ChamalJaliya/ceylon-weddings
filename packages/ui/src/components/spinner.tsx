import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

/** Inline busy glyph for buttons and compact areas. */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none", className)}
    />
  );
}

/**
 * Full card / page-section loader (Kloqra CenteredLoader). Prefer this or a
 * Skeleton over bare "Loading…" text in primary content.
 */
export function CenteredLoader({
  label = "Loading…",
  className,
  minHeight = "min-h-48",
}: {
  label?: React.ReactNode;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      data-slot="centered-loader"
      role="status"
      aria-live="polite"
      className={cn("grid place-items-center content-center gap-3 text-center", minHeight, className)}
    >
      <Loader2 aria-hidden className="size-6 animate-spin text-primary motion-reduce:animate-none" />
      {label ? <p className="text-caption text-muted-foreground">{label}</p> : null}
    </div>
  );
}
