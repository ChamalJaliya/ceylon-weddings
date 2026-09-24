"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { AnimateIcon } from "../components/icon";

export function AppHeader({
  tone = "glass",
  crumb,
  search,
  trail,
  leading,
}: {
  tone?: "glass" | "overlay";
  crumb?: ReactNode;
  search?: ReactNode;
  trail?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div
      data-slot="app-header"
      data-tone={tone}
      className={cn(
        "flex h-12 items-center gap-2 rounded-full border px-2 shadow-card sm:gap-3 sm:px-3",
        tone === "overlay"
          ? "border-hero-foreground/15 bg-hero-foreground/12 text-hero-foreground backdrop-blur-md"
          : "border-border bg-card/80 text-foreground backdrop-blur-md",
      )}
    >
      {leading ? <div className="flex shrink-0 items-center gap-1">{leading}</div> : null}
      {crumb ? (
        <div
          className={cn(
            "hidden shrink-0 pl-1 text-xs tracking-wide sm:block",
            tone === "overlay" ? "text-hero-muted" : "text-muted-foreground",
          )}
        >
          {crumb}
        </div>
      ) : null}
      {search ? <div className="min-w-0 flex-1">{search}</div> : <div className="min-w-0 flex-1" />}
      {trail ? <div className="ml-auto flex shrink-0 items-center gap-1.5">{trail}</div> : null}
    </div>
  );
}

export function AppHeaderSearch({
  icon,
  placeholder,
  overlay = false,
  onClick,
  shortcut = "⌘K",
}: {
  icon: ReactNode;
  placeholder: string;
  overlay?: boolean;
  onClick?: () => void;
  shortcut?: string;
}) {
  return (
    <AnimateIcon animateOnHover asChild>
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-9 w-full max-w-md items-center justify-between gap-2 rounded-full px-3 text-sm transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer select-none",
        overlay ? "bg-hero-foreground/8 text-hero-muted hover:bg-hero-foreground/15" : "bg-muted/70 text-muted-foreground",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{placeholder}</span>
      </div>
      {shortcut ? (
        <kbd className="hidden sm:inline-flex items-center rounded border border-border/80 bg-card/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground shadow-2xs group-hover:border-border">
          {shortcut}
        </kbd>
      ) : null}
    </button>
    </AnimateIcon>
  );
}

