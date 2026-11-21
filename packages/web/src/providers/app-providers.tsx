"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useRef, type ReactNode } from "react";
import { ConfirmProvider } from "@ceylonweddings/ui/components/confirm-dialog";
import { Toaster } from "@ceylonweddings/ui/components/toaster";
import { CwMotionProvider } from "@ceylonweddings/ui/domain/motion";
import { applyDocumentPalette, usePaletteStore } from "../appearance/appearance";
import { THEME_CLASS, THEME_STORAGE_KEY } from "../appearance/constants";
import { useAuthStore } from "../stores/auth";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster dark={resolvedTheme === "dark"} />;
}

/**
 * When the signed-in account carries a saved mode / palette, it wins over this
 * device (Kloqra theme-preference-sync) — once per sign-in, so local changes
 * made afterwards are not overwritten.
 */
function AppearanceSync() {
  const user = useAuthStore((state) => state.user);
  const palette = usePaletteStore((state) => state.palette);
  const setPalette = usePaletteStore((state) => state.setPalette);
  const { setTheme } = useTheme();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => applyDocumentPalette(palette), [palette]);

  useEffect(() => {
    if (!user || syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    const prefs = user.preferences ?? {};
    if (prefs.themeMode) setTheme(prefs.themeMode);
    if (prefs.palette) setPalette(prefs.palette);
  }, [user, setTheme, setPalette]);

  return null;
}

/**
 * App-wide providers: theme (mode × palette), motion, confirm dialogs and toasts.
 * Mounted once in apps/web/src/app/[locale]/layout.tsx.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      storageKey={THEME_STORAGE_KEY}
      themes={["light", "dark"]}
      value={THEME_CLASS}
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AppearanceSync />
      <CwMotionProvider>
        <ConfirmProvider>
          {children}
          <ThemedToaster />
        </ConfirmProvider>
      </CwMotionProvider>
    </ThemeProvider>
  );
}
