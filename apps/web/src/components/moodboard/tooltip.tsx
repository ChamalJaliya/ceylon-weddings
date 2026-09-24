"use client";

import type { ReactNode } from "react";
import { cn } from "@ceylonweddings/ui/utils";

export function MoodboardTooltip({
  label,
  shortcut,
  side = "right",
  children,
}: {
  label: string;
  shortcut?: string;
  side?: "right" | "bottom" | "top";
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-[#1f1a16] px-2 py-1 text-[11px] font-medium text-[#fffaf5] shadow-lg ring-1 ring-white/10 group-hover:block group-focus-within:block",
          side === "right" && "top-1/2 left-[calc(100%+0.45rem)] -translate-y-1/2",
          side === "bottom" && "top-[calc(100%+0.4rem)] left-1/2 -translate-x-1/2",
          side === "top" && "bottom-[calc(100%+0.4rem)] left-1/2 -translate-x-1/2",
        )}
      >
        {label}
        {shortcut ? (
          <kbd className="ml-1.5 rounded bg-white/15 px-1 py-px font-mono text-[10px] text-[#fffaf5]/80">
            {shortcut}
          </kbd>
        ) : null}
      </span>
    </span>
  );
}
