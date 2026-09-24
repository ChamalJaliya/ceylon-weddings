"use client";

import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";

export function AttributeHelp({
  text,
  className,
  label = "More info",
}: {
  text?: string | null;
  className?: string;
  label?: string;
}) {
  if (!text?.trim()) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground",
            className,
          )}
          aria-label={label}
        >
          <CircleHelp className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm leading-relaxed" align="start">
        {text}
      </PopoverContent>
    </Popover>
  );
}
