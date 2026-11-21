"use client";

import type { DashboardKind, WidgetEmphasis, WidgetLayoutItem } from "@ceylonweddings/contracts";
import { create } from "zustand";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import {
  applyGridPositions,
  mergeLayoutWithRegistry,
  normalizeForSave,
  setEmphasis,
  toggleWidgetVisibility,
  type WidgetSizing,
} from "./layout-model";

export type DashboardLayoutState = {
  /** Current on-screen layout (null until initialised). */
  layout: WidgetLayoutItem[] | null;
  initialized: boolean;
  /** Account the layout belongs to; signing in as someone else reloads it. */
  ownerId: string | null;
  /** Load from the account's saved layout (or the role default). Runs once per account. */
  initialize: (saved: WidgetLayoutItem[] | null | undefined, ownerId: string) => void;
  /** Replace the on-screen layout without saving (edit mode; Cancel restores a snapshot). */
  setLayout: (layout: WidgetLayoutItem[]) => void;
  /** Positions reported by react-grid-layout after a drag / resize. */
  applyGrid: (grid: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  toggleWidget: (id: string, options?: { persist?: boolean }) => Promise<void>;
  setWidgetEmphasis: (id: string, emphasis: WidgetEmphasis, options?: { persist?: boolean }) => Promise<void>;
  /** Save the on-screen layout (or `items`) to the account. */
  persist: (items?: WidgetLayoutItem[]) => Promise<void>;
  /** Restore the built-in role layout and save it. */
  reset: () => Promise<void>;
};

export type DashboardLayoutStore = ReturnType<typeof createDashboardLayoutStore>;

/** Save one dashboard's layout on the account; other dashboards' layouts are untouched. */
export async function saveDashboardLayout(kind: DashboardKind, layout: WidgetLayoutItem[]) {
  const user = await api.account.updatePreferences({ dashboardLayouts: { [kind]: normalizeForSave(layout) } });
  useAuthStore.getState().setUser(user);
}

export function createDashboardLayoutStore(options: {
  kind: DashboardKind;
  registry: WidgetSizing[];
  defaultLayout: WidgetLayoutItem[];
}) {
  const { kind, registry, defaultLayout } = options;
  const merge = (saved: WidgetLayoutItem[] | null | undefined) =>
    mergeLayoutWithRegistry(saved, registry, defaultLayout);

  return create<DashboardLayoutState>((set, get) => {
    /** Optimistic update; a failed save rolls the screen back and rethrows for the caller's toast. */
    async function change(next: WidgetLayoutItem[], persist: boolean) {
      const previous = get().layout;
      set({ layout: next });
      if (!persist) return;
      try {
        await saveDashboardLayout(kind, next);
      } catch (error) {
        set({ layout: previous });
        throw error;
      }
    }

    return {
      layout: null,
      initialized: false,
      ownerId: null,
      initialize: (saved, ownerId) => {
        if (get().initialized && get().ownerId === ownerId) return;
        set({ layout: merge(saved), initialized: true, ownerId });
      },
      setLayout: (layout) => set({ layout: layout.map((item) => ({ ...item })) }),
      applyGrid: (grid) => {
        const current = get().layout;
        if (current) set({ layout: applyGridPositions(current, grid, registry) });
      },
      toggleWidget: async (id, opts) => {
        const current = get().layout ?? merge(null);
        await change(toggleWidgetVisibility(current, id, registry), opts?.persist !== false);
      },
      setWidgetEmphasis: async (id, emphasis, opts) => {
        const current = get().layout ?? merge(null);
        await change(setEmphasis(current, id, emphasis), opts?.persist !== false);
      },
      persist: async (items) => {
        const layout = items ?? get().layout;
        if (layout) await saveDashboardLayout(kind, layout);
      },
      reset: async () => {
        await change(merge(null), true);
      },
    };
  });
}
