"use client";

import type { ReactNode } from "react";
import { Switch } from "../components/switch";
import { cn } from "../lib/utils";

/** Bordered label + switch row used in settings / taxonomy editors. */
export function SettingsSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      data-slot="settings-switch-row"
    >
      <div className="min-w-0 grid gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description != null ? <span className="text-xs text-muted-foreground">{description}</span> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}
