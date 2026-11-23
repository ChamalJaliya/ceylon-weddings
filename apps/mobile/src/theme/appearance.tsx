import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PALETTE,
  parseUserPreferences,
  paletteSchema,
  themeModeSchema,
  type Palette,
  type ThemeMode,
  type UpdatePreferencesBody,
  type User,
} from "@ceylonweddings/contracts";
import { resolveTheme } from "./resolve";
import type { Theme } from "./tokens";

/** Align with web localStorage keys (packages/web appearance constants). */
export const THEME_STORAGE_KEY = "cw-theme";
export const PALETTE_STORAGE_KEY = "cw-palette";

type AppearanceState = {
  mode: ThemeMode;
  palette: Palette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: Palette) => void;
  /** Persist to account when signed in (non-blocking). */
  syncAccount: (patch: UpdatePreferencesBody) => Promise<void>;
  /** Apply prefs from the signed-in user once (account wins over device). */
  hydrateFromUser: (user: User | null) => void;
};

const AppearanceCtx = createContext<AppearanceState | null>(null);

type PersistFns = {
  updatePreferences?: (body: UpdatePreferencesBody) => Promise<User>;
  onUserUpdated?: (user: User) => void;
};

export function AppearanceProvider({
  children,
  updatePreferences,
  onUserUpdated,
}: { children: ReactNode } & PersistFns) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [palette, setPaletteState] = useState<Palette>(DEFAULT_PALETTE);
  const [ready, setReady] = useState(false);
  const [accountHydrated, setAccountHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedMode, storedPalette] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(PALETTE_STORAGE_KEY),
        ]);
        if (cancelled) return;
        const modeParsed = themeModeSchema.safeParse(storedMode);
        if (modeParsed.success) setModeState(modeParsed.data);
        const paletteParsed = paletteSchema.safeParse(storedPalette);
        if (paletteParsed.success) setPaletteState(paletteParsed.data);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next);
    void AsyncStorage.setItem(PALETTE_STORAGE_KEY, next);
  }, []);

  const syncAccount = useCallback(
    async (patch: UpdatePreferencesBody) => {
      if (!updatePreferences) return;
      try {
        const user = await updatePreferences(patch);
        onUserUpdated?.(user);
      } catch {
        /* device already saved — account sync is best-effort */
      }
    },
    [updatePreferences, onUserUpdated],
  );

  const hydrateFromUser = useCallback(
    (user: User | null) => {
      if (!ready) return;
      if (!user) {
        setAccountHydrated(false);
        return;
      }
      if (accountHydrated) return;
      const prefs = parseUserPreferences(user.preferences);
      if (prefs.themeMode) {
        setModeState(prefs.themeMode);
        void AsyncStorage.setItem(THEME_STORAGE_KEY, prefs.themeMode);
      }
      if (prefs.palette) {
        setPaletteState(prefs.palette);
        void AsyncStorage.setItem(PALETTE_STORAGE_KEY, prefs.palette);
      }
      setAccountHydrated(true);
    },
    [accountHydrated, ready],
  );

  const value = useMemo(
    () => ({ mode, palette, setMode, setPalette, syncAccount, hydrateFromUser }),
    [mode, palette, setMode, setPalette, syncAccount, hydrateFromUser],
  );

  return createElement(AppearanceCtx.Provider, { value }, children);
}

export function useAppearance(): AppearanceState {
  const ctx = useContext(AppearanceCtx);
  if (!ctx) throw new Error("useAppearance must be inside AppearanceProvider");
  return ctx;
}

/** @deprecated Prefer useAppearance — kept for gradual migration. */
export function useThemeMode() {
  const { mode, setMode } = useAppearance();
  return { mode, setMode };
}

export function useTheme(): Theme {
  const system = useColorScheme();
  const { mode, palette } = useAppearance();
  const dark = mode === "system" ? system === "dark" : mode === "dark";
  return useMemo(() => resolveTheme(dark, palette), [dark, palette]);
}
