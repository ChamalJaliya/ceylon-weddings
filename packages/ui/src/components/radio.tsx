"use client";

import * as React from "react";
import { cn } from "../lib/utils";

const radioFace =
  "pointer-events-none absolute inset-0 rounded-full border border-border/80 bg-muted/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-[border-color,box-shadow,background-color] duration-200 after:absolute after:inset-[3.5px] after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity after:duration-150 peer-hover:border-border peer-hover:bg-muted/80 peer-focus-visible:border-ring/70 peer-focus-visible:shadow-[0_0_0_4px_color-mix(in_oklch,var(--ring)_18%,transparent)] peer-checked:border-primary peer-checked:bg-background peer-checked:after:opacity-100 peer-disabled:opacity-50";

export const Radio = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <span className={cn("relative inline-flex size-[1.125rem] shrink-0", className)}>
      <input
        ref={ref}
        type="radio"
        data-slot="radio"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span className={radioFace} aria-hidden />
    </span>
  ),
);
Radio.displayName = "Radio";

export function RadioField({
  label,
  description,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Radio> & {
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-2xl border border-transparent px-1 py-0.5 text-sm leading-snug",
        "has-[:checked]:text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <Radio className="mt-0.5" {...props} />
      <span className="grid min-w-0 gap-0.5">
        <span className="font-medium text-foreground/90">{label}</span>
        {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </label>
  );
}

export function RadioGroup({
  value,
  onValueChange,
  options,
  name,
  disabled,
  orientation = "horizontal",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: React.ReactNode; description?: React.ReactNode }>;
  name?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const autoName = React.useId();
  const groupName = name ?? autoName;

  return (
    <div
      role="radiogroup"
      data-slot="radio-group"
      className={cn(
        "grid gap-2",
        orientation === "horizontal" && "sm:grid-flow-col sm:auto-cols-fr",
        className,
      )}
    >
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm transition-[border-color,background-color,box-shadow] duration-200",
              option.description ? "items-start" : "items-center",
              checked
                ? "border-primary/50 bg-primary/8 shadow-sm"
                : "border-border/70 bg-muted/35 hover:border-border hover:bg-muted/60",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Radio
              name={groupName}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onValueChange(option.value)}
              className={option.description ? "mt-0.5" : undefined}
            />
            <span className="grid min-w-0 gap-0.5">
              <span className="font-medium leading-none text-foreground/90">{option.label}</span>
              {option.description ? (
                <span className="text-xs text-muted-foreground">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
