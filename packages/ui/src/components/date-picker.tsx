"use client";

import { format, isValid, parse, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";
import { Calendar } from "./calendar";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { TimePicker } from "./time-picker";

function parseDateValue(value?: string | null) {
  if (!value) return undefined;
  const iso = parseISO(value.length === 10 ? `${value}T00:00:00` : value);
  if (isValid(iso)) return iso;
  const local = parse(value, "yyyy-MM-dd", new Date());
  return isValid(local) ? local : undefined;
}

function toDateString(date?: Date) {
  return date && isValid(date) ? format(date, "yyyy-MM-dd") : "";
}

function toDateTimeLocalString(date?: Date) {
  return date && isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

function DateTrigger({
  selected,
  placeholder,
  disabled,
  className,
  slot,
}: {
  selected?: Date;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  slot: string;
}) {
  return (
    <PopoverTrigger asChild>
      <button
        type="button"
        disabled={disabled}
        data-slot={slot}
        className={cn(fieldVariants(), "cursor-pointer justify-start gap-2.5 text-left font-normal", className)}
      >
        <Icon icon={CalendarIcon} size="sm" className="text-muted-foreground/80" />
        <span className={cn("flex-1 truncate", !selected && "text-muted-foreground/65")}>
          {selected ? format(selected, "PPP") : placeholder}
        </span>
      </button>
    </PopoverTrigger>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const selected = parseDateValue(value);

  return (
    <Popover>
      <DateTrigger
        selected={selected}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        slot="date-picker"
      />
      <PopoverContent align="start" className="w-auto overflow-hidden rounded-2xl p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(toDateString(date))}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const selected = value ? parseDateValue(value) : undefined;
  const time = selected ? format(selected, "HH:mm") : "";

  function commit(nextDate?: Date, nextTime = time || "09:00") {
    if (!nextDate) {
      onChange("");
      return;
    }
    const [hours, minutes] = nextTime.split(":").map(Number);
    const merged = new Date(nextDate);
    merged.setHours(hours || 0, minutes || 0, 0, 0);
    onChange(toDateTimeLocalString(merged));
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem]", className)}>
      <Popover>
        <DateTrigger selected={selected} placeholder={placeholder} disabled={disabled} slot="datetime-picker" />
        <PopoverContent align="start" className="w-auto overflow-hidden rounded-2xl p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => commit(date, time || "09:00")}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <TimePicker
        value={time || null}
        disabled={disabled || !selected}
        onChange={(nextTime) => commit(selected, nextTime)}
      />
    </div>
  );
}
