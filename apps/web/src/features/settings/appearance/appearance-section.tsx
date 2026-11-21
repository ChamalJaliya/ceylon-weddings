"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { PALETTE_OPTIONS, type Palette, type ThemeMode, type UpdatePreferencesBody } from "@ceylonweddings/contracts";
import { api, useAuthStore, usePaletteStore } from "@ceylonweddings/web";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { cn } from "@ceylonweddings/ui/utils";
import { SettingsCard } from "../components/settings-card";

const MODES: ReadonlyArray<{ value: ThemeMode; label: string; description: string; icon: LucideIcon }> = [
  { value: "light", label: "Light", description: "Bright and airy", icon: Sun },
  { value: "dark", label: "Dark", description: "Easy on the eyes", icon: Moon },
  { value: "system", label: "System", description: "Matches your device", icon: Monitor },
];

/**
 * A miniature of the app drawn with the real tokens: `modeClass` picks light
 * (pearl) or dark (night), `palette` sets data-palette on the same element.
 */
function Preview({ modeClass, palette }: { modeClass: "pearl" | "night"; palette: Palette }) {
  return (
    <div
      className={cn(modeClass, "grid gap-1.5 rounded-xl border border-border bg-background p-2.5")}
      data-palette={palette}
      aria-hidden
    >
      <div className="flex gap-1.5">
        <span className="grid w-6 gap-1 rounded-md bg-sidebar p-1">
          <span className="h-1 rounded-full bg-primary" />
          <span className="h-1 rounded-full bg-muted-foreground/40" />
          <span className="h-1 rounded-full bg-muted-foreground/40" />
        </span>
        <span className="grid flex-1 gap-1 rounded-md border border-border bg-card p-1.5 shadow-sm">
          <span className="h-1.5 w-2/3 rounded-full bg-foreground/75" />
          <span className="h-1 w-full rounded-full bg-muted-foreground/30" />
          <span className="mt-0.5 flex gap-1">
            <span className="h-2.5 w-8 rounded-full bg-primary" />
            <span className="h-2.5 w-6 rounded-full bg-secondary" />
          </span>
        </span>
      </div>
    </div>
  );
}

function SelectedDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
      )}
    >
      {selected ? <Icon icon={Check} size="xs" lottie={false} /> : null}
    </span>
  );
}

export default function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const palette = usePaletteStore((state) => state.palette);
  const setPalette = usePaletteStore((state) => state.setPalette);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  // next-themes only knows the theme after mount; avoid a hydration flash.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mode = (mounted ? theme : null) as ThemeMode | null;
  const previewMode: "pearl" | "night" = mounted && resolvedTheme === "dark" ? "night" : "pearl";

  /** Applies instantly on this device; saved to the account so it follows you. */
  async function save(patch: UpdatePreferencesBody) {
    if (!user) return;
    try {
      setUser(await api.account.updatePreferences(patch));
    } catch {
      toast.error("Saved on this device only — we couldn't reach your account.");
    }
  }

  return (
    <>
      <SettingsCard title="Mode" description="Light, dark, or follow your device.">
        <div role="radiogroup" aria-label="Mode" className="grid gap-3 sm:grid-cols-3">
          {MODES.map((option) => {
            const selected = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value);
                  void save({ themeMode: option.value });
                }}
                className={cn("card grid gap-3 p-3 text-left", selected ? "card--selected" : "card--interactive")}
              >
                {option.value === "system" ? (
                  <div className="grid grid-cols-2 overflow-hidden rounded-xl">
                    <Preview modeClass="pearl" palette={palette} />
                    <Preview modeClass="night" palette={palette} />
                  </div>
                ) : (
                  <Preview modeClass={option.value === "dark" ? "night" : "pearl"} palette={palette} />
                )}
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="flex items-center gap-2">
                    <Icon icon={option.icon} size="xs" lottie={false} className="text-muted-foreground" />
                    <span className="grid">
                      <span className="font-medium text-foreground">{option.label}</span>
                      <span className="text-caption text-muted-foreground">{option.description}</span>
                    </span>
                  </span>
                  <SelectedDot selected={selected} />
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Palette"
        description="Every palette works in light and dark mode. Ceylon is our signature ivory and gold — plus festive wedding moodboard palettes."
      >
        <div role="radiogroup" aria-label="Palette" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PALETTE_OPTIONS.map((option) => {
            const selected = mounted && palette === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                data-testid={`palette-option-${option.value}`}
                onClick={() => {
                  setPalette(option.value);
                  void save({ palette: option.value });
                }}
                className={cn("card grid gap-2.5 p-2.5 text-left", selected ? "card--selected" : "card--interactive")}
              >
                <Preview modeClass={previewMode} palette={option.value} />
                <div className="flex items-start justify-between gap-2 px-0.5">
                  <span className="grid min-w-0">
                    <span className="truncate text-compact font-medium text-foreground">{option.label}</span>
                    <span className="truncate text-caption text-muted-foreground">{option.description}</span>
                  </span>
                  <SelectedDot selected={selected} />
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </>
  );
}
