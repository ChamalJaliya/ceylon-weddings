"use client";

import type { ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { cn } from "../lib/utils";
import { AttributeHelp } from "./attribute-help";

export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  imageUrl,
  icon,
  helpText,
  multi,
  disabled,
  count,
  /** check = answer pick (default). edit = admin refine. none = highlight only. */
  indicator = "check",
  className,
}: {
  selected?: boolean;
  onSelect: () => void;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  icon?: ReactNode;
  helpText?: string | null;
  multi?: boolean;
  disabled?: boolean;
  count?: number | null;
  indicator?: "check" | "edit" | "none";
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card text-left transition",
        imageUrl ? "min-h-24 overflow-hidden" : "min-h-[4.5rem] overflow-visible",
        "hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/80",
        disabled && "cursor-not-allowed opacity-45 hover:border-border/80 hover:shadow-none",
        className,
      )}
    >
      {imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="flex flex-1 items-start gap-3 p-4">
        {icon && !imageUrl ? (
          <span className="grid size-11 shrink-0 place-items-center overflow-visible rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-serif text-lg font-semibold leading-tight tracking-tight">
              {title}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <AttributeHelp text={helpText} />
              {typeof count === "number" ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {count}
                </span>
              ) : null}
              {indicator !== "none" ? (
                <span
                  className={cn(
                    "grid size-5 place-items-center border transition",
                    multi && indicator === "check" ? "rounded-md" : "rounded-full",
                    indicator === "edit"
                      ? selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 text-muted-foreground opacity-0 group-hover:opacity-100"
                      : selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 text-transparent",
                  )}
                  aria-hidden
                >
                  {indicator === "edit" ? (
                    <Pencil className="size-3" />
                  ) : selected ? (
                    <Check className="size-3" />
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
