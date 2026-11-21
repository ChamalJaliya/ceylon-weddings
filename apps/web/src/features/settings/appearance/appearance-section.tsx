"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { COOKIES } from "@ceylonweddings/web";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { cn } from "@ceylonweddings/ui/utils";
import { SettingsCard } from "../components/settings-card";

const THEMES = [
  { id: "pearl", name: "Pearl", blurb: "Ivory paper and champagne gold. Light and airy." },
  { id: "temple", name: "Temple", blurb: "Sandalwood and kumkum maroon. Warm and traditional." },
  { id: "night", name: "Night", blurb: "Warm ink with gold leaf. Easy on the eyes after dark." },
] as const;

/**
 * Each card renders a miniature of the app inside that theme's own class, so
 * the preview is the real tokens — not a screenshot that can drift.
 */
function ThemePreview({ theme }: { theme: (typeof THEMES)[number]["id"] }) {
  return (
    <div className={cn(theme, "grid gap-2 rounded-xl border border-border bg-background p-3")} aria-hidden>
      <div className="flex items-center justify-between">
        <span className="h-2 w-12 rounded-full bg-foreground/80" />
        <span className="h-2 w-6 rounded-full bg-muted-foreground/40" />
      </div>
      <div className="grid gap-1.5 rounded-lg border border-border bg-card p-2.5 shadow-sm">
        <span className="h-2 w-20 rounded-full bg-foreground/70" />
        <span className="h-1.5 w-full rounded-full bg-muted-foreground/25" />
        <span className="h-1.5 w-3/4 rounded-full bg-muted-foreground/25" />
        <div className="mt-1 flex gap-1.5">
          <span className="h-4 w-12 rounded-full bg-primary" />
          <span className="h-4 w-10 rounded-full border border-border bg-secondary" />
        </div>
      </div>
      <div className="flex gap-1">
        {["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"].map((c) => (
          <span key={c} className={cn("h-1.5 flex-1 rounded-full", c)} />
        ))}
      </div>
    </div>
  );
}

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the theme after mount; avoid a hydration flash.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "pearl") : null;

  return (
    <SettingsCard title="Theme" description="Applies on this device. Guests see your wedding website's own design.">
      <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-3">
        {THEMES.map((option) => {
          const selected = current === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setTheme(option.id);
                document.cookie = `${COOKIES.theme}=${option.id}; path=/; max-age=31536000; samesite=lax`;
              }}
              className={cn(
                "card grid gap-3 p-3 text-left transition-shadow",
                selected ? "card--selected" : "card--interactive",
              )}
            >
              <ThemePreview theme={option.id} />
              <div className="flex items-start justify-between gap-2 px-1">
                <div className="grid gap-0.5">
                  <span className="font-medium text-foreground">{option.name}</span>
                  <span className="text-caption text-muted-foreground">{option.blurb}</span>
                </div>
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {selected ? <Icon icon={Check} size="xs" lottie={false} /> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </SettingsCard>
  );
}
