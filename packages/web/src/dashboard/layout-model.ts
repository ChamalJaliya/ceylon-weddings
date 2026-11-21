import type { WidgetEmphasis, WidgetLayoutItem } from "@ceylonweddings/contracts";

/**
 * Pure layout operations shared by every widget dashboard (Kloqra's
 * create-widget-layout-store, minus its legacy row-unit migration).
 */

/** What the layout model needs to know about a widget from a dashboard's registry. */
export type WidgetSizing = {
  id: string;
  defaultVisible: boolean;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
};

export function clampWidgetSize(w: number, h: number, reg?: WidgetSizing): { w: number; h: number } {
  let nextW = Math.max(w, reg?.minSize?.w ?? 1);
  let nextH = Math.max(h, reg?.minSize?.h ?? 1);
  if (reg?.maxSize) {
    nextW = Math.min(nextW, reg.maxSize.w);
    nextH = Math.min(nextH, reg.maxSize.h);
  }
  return { w: nextW, h: nextH };
}

function overlaps(a: WidgetLayoutItem, b: WidgetLayoutItem) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const GROUP_FIELDS = ["groupId", "groupName", "groupOrder", "groupColumns", "groupHideLabel"] as const;

/**
 * Reconcile a saved layout with the current registry:
 * - widgets that no longer exist are dropped;
 * - saved widgets keep position, visibility, emphasis and group (sizes re-clamped);
 * - widgets added since the save take their default slot, or the next free row
 *   (left-aligned) when that slot is now taken.
 */
export function mergeLayoutWithRegistry(
  saved: WidgetLayoutItem[] | null | undefined,
  registry: WidgetSizing[],
  defaultLayout: WidgetLayoutItem[],
): WidgetLayoutItem[] {
  const source = saved?.length ? saved : defaultLayout;
  const out: WidgetLayoutItem[] = [];
  let nextY = source.reduce((max, item) => (item.visible === false ? max : Math.max(max, item.y + item.h)), 0);

  for (const reg of registry) {
    const prior = source.find((item) => item.i === reg.id);
    if (prior) {
      const size = clampWidgetSize(prior.w, prior.h, reg);
      const kept: WidgetLayoutItem = {
        i: reg.id,
        x: prior.x,
        y: prior.y,
        w: size.w,
        h: size.h,
        visible: typeof prior.visible === "boolean" ? prior.visible : reg.defaultVisible,
        ...(prior.emphasis ? { emphasis: prior.emphasis } : {}),
      };
      if (prior.groupId) {
        for (const field of GROUP_FIELDS) {
          if (prior[field] !== undefined) (kept as Record<string, unknown>)[field] = prior[field];
        }
      }
      out.push(kept);
      continue;
    }
    const fallback = defaultLayout.find((item) => item.i === reg.id);
    const candidate: WidgetLayoutItem = fallback
      ? { ...fallback }
      : { i: reg.id, x: 0, y: nextY, w: reg.defaultSize.w, h: reg.defaultSize.h, visible: reg.defaultVisible };
    if (
      candidate.visible !== false &&
      [...source, ...out].some((item) => item.visible !== false && item.i !== candidate.i && overlaps(item, candidate))
    ) {
      candidate.x = 0;
      candidate.y = nextY;
    }
    if (candidate.visible !== false) nextY = Math.max(nextY, candidate.y + candidate.h);
    out.push(candidate);
  }
  return out;
}

/** Apply react-grid-layout positions (by key) onto the layout, re-clamping sizes. */
export function applyGridPositions(
  layout: WidgetLayoutItem[],
  grid: { i: string; x: number; y: number; w: number; h: number }[],
  registry: WidgetSizing[],
): WidgetLayoutItem[] {
  const byId = new Map(grid.map((rect) => [rect.i, rect]));
  return layout.map((item) => {
    const rect = byId.get(item.i);
    if (!rect) return item;
    const size = clampWidgetSize(
      rect.w,
      rect.h,
      registry.find((reg) => reg.id === item.i),
    );
    return { ...item, x: rect.x, y: rect.y, w: size.w, h: size.h };
  });
}

/** Show (placed on a new row at the bottom) or hide one widget. */
export function toggleWidgetVisibility(
  layout: WidgetLayoutItem[],
  id: string,
  registry: WidgetSizing[],
): WidgetLayoutItem[] {
  const bottom = layout.reduce((max, item) => (item.visible ? Math.max(max, item.y + item.h) : max), 0);
  if (!layout.some((item) => item.i === id)) {
    const reg = registry.find((entry) => entry.id === id);
    return [
      ...layout,
      { i: id, x: 0, y: bottom, w: reg?.defaultSize.w ?? 4, h: reg?.defaultSize.h ?? 8, visible: true },
    ];
  }
  return layout.map((item) => {
    if (item.i !== id) return item;
    return item.visible ? { ...item, visible: false } : { ...item, x: 0, y: bottom, visible: true };
  });
}

export function setEmphasis(layout: WidgetLayoutItem[], id: string, emphasis: WidgetEmphasis): WidgetLayoutItem[] {
  return layout.map((item) => (item.i === id ? { ...item, emphasis } : item));
}

/** Integer grid units, no float noise from mid-drag events. */
export function normalizeForSave(layout: WidgetLayoutItem[]): WidgetLayoutItem[] {
  return layout.map((item) => ({
    ...item,
    x: Math.max(0, Math.round(item.x)),
    y: Math.max(0, Math.round(item.y)),
    w: Math.max(1, Math.round(item.w)),
    h: Math.max(1, Math.round(item.h)),
  }));
}

export function sameLayout(a: WidgetLayoutItem[] | null | undefined, b: WidgetLayoutItem[] | null | undefined) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
