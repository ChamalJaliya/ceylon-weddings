"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareVendor = {
  id: string;
  slug: string;
  name: string;
  category: string;
  photoUrl?: string | null;
};

const MAX_COMPARE = 3;

type CompareState = {
  items: CompareVendor[];
  toggle: (vendor: CompareVendor) => { ok: boolean; reason?: string };
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (slug) => get().items.some((item) => item.slug === slug),
      remove: (slug) => set({ items: get().items.filter((item) => item.slug !== slug) }),
      clear: () => set({ items: [] }),
      toggle: (vendor) => {
        const current = get().items;
        if (current.some((item) => item.slug === vendor.slug)) {
          set({ items: current.filter((item) => item.slug !== vendor.slug) });
          return { ok: true };
        }
        if (current.length >= MAX_COMPARE) {
          return { ok: false, reason: `Compare up to ${MAX_COMPARE} vendors` };
        }
        if (current.length && current[0]!.category !== vendor.category) {
          return {
            ok: false,
            reason: "Compare vendors in the same category — clear the dock or pick another venue/photographer peer.",
          };
        }
        set({ items: [...current, vendor] });
        return { ok: true };
      },
    }),
    { name: "cw-vendor-compare" },
  ),
);

export { MAX_COMPARE };
