"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Clock } from "lucide-react";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
type Period = "AM" | "PM";

function parseTime(value?: string | null): { hour12: number; minute: number; period: Period } {
  if (!value) return { hour12: 9, minute: 0, period: "AM" };
  const [rawHour, rawMinute] = value.split(":").map(Number);
  const hour = Number.isFinite(rawHour) ? rawHour : 9;
  const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
  const period: Period = hour >= 12 ? "PM" : "AM";
  return { hour12: hour % 12 || 12, minute, period };
}

function toTimeValue(hour12: number, minute: number, period: Period) {
  let hour = hour12 % 12;
  if (period === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplay(value?: string | null) {
  if (!value) return "";
  const { hour12, minute, period } = parseTime(value);
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function TimeColumn<T extends string | number>({
  values,
  selected,
  onSelect,
  format = String,
}: {
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
  format?: (value: T) => string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "center" });
  }, [selected]);

  return (
    <div
      ref={listRef}
      className="flex max-h-52 flex-col gap-0.5 overflow-y-auto overscroll-contain px-1 py-1"
    >
      {values.map((value) => {
        const active = value === selected;
        return (
          <button
            key={String(value)}
            type="button"
            data-active={active || undefined}
            onClick={() => onSelect(value)}
            className={cn(
              "min-w-11 rounded-xl px-2.5 py-1.5 text-center text-sm tabular-nums transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-muted",
            )}
          >
            {format(value)}
          </button>
        );
      })}
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
  disabled,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const selected = parseTime(value);
  const minuteOptions = MINUTES.includes(selected.minute)
    ? MINUTES
    : [...MINUTES, selected.minute].sort((a, b) => a - b);

  function commit(next: Partial<typeof selected>) {
    const merged = { ...selected, ...next };
    onChange(toTimeValue(merged.hour12, merged.minute, merged.period));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-slot="time-picker"
          className={cn(fieldVariants(), "cursor-pointer justify-start gap-2.5 text-left font-normal", className)}
        >
          <Icon icon={Clock} size="sm" className="text-muted-foreground/80" />
          <span className={cn("flex-1 truncate tabular-nums", !value && "text-muted-foreground/65")}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-2">
        <div className="flex gap-1">
          <TimeColumn
            values={HOURS_12}
            selected={selected.hour12}
            onSelect={(hour12) => commit({ hour12 })}
          />
          <TimeColumn
            values={minuteOptions}
            selected={selected.minute}
            onSelect={(minute) => commit({ minute })}
            format={(minute) => String(minute).padStart(2, "0")}
          />
          <TimeColumn
            values={["AM", "PM"] as Period[]}
            selected={selected.period}
            onSelect={(period) => commit({ period })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
