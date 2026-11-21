import * as React from "react";
import { cn } from "../lib/utils";

/** Shimmering placeholder block. Size it with layout utilities (h-4 w-32, aspect-video …). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("cw-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** A stack of text-line skeletons; last line is shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Card-shaped placeholder grid for list pages. */
export function SkeletonCards({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card--raised grid gap-3 p-5">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  );
}
