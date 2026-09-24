"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxOption = {
  value: string;
  label: string;
};

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    );
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(fieldVariants(), "cursor-pointer justify-between gap-2 text-left", className)}
        >
          <span className={cn("min-w-0 truncate", !selected && "text-muted-foreground/65")}>
            {selected?.label ?? placeholder}
          </span>
          <Icon icon={ChevronsUpDown} size="sm" className="shrink-0 text-muted-foreground/80" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1.5">
        <div className="relative mb-1.5">
          <Icon
            icon={Search}
            size="sm"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground/70"
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-xl border-0 bg-muted/60 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground/65 focus:bg-muted"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-0.5">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm",
                    active ? "bg-primary/8 font-medium" : "hover:bg-accent/80",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? <Icon icon={Check} size="xs" className="shrink-0 text-primary" /> : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
