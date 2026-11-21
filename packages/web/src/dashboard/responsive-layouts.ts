import type { WidgetLayoutItem } from "@ceylonweddings/contracts";

/**
 * Responsive grid metrics for widget dashboards (Kloqra's generate-responsive-layouts).
 * Desktop keeps the author's positions; narrower grids reflow, phones stack.
 *
 * With ROW_HEIGHT 32 and MARGIN 16: h=3 → 128px (KPI), h=8 → 368px, h=10 → 464px.
 */
export type DashboardBreakpoint = "lg" | "md" | "sm" | "xs" | "xxs";

export const DASHBOARD_GRID_ROW_HEIGHT = 32;
export const DASHBOARD_GRID_MARGIN = 16;

export const DASHBOARD_GRID_BREAKPOINTS: Record<DashboardBreakpoint, number> = {
  lg: 900,
  md: 768,
  sm: 640,
  xs: 480,
  xxs: 0,
};

export const DASHBOARD_GRID_COLS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  /** Same as lg so opening / collapsing the rail never switches column counts. */
  md: 12,
  sm: 6,
  xs: 4,
  xxs: 2,
};

/** Column count of the layout that gets saved (the desktop arrangement). */
export const DASHBOARD_PERSIST_COLS = DASHBOARD_GRID_COLS.lg;

/** Only the 12-column grid is saved; reflowed phone layouts are derived, never stored. */
export function isPersistableDashboardBreakpoint(breakpoint: DashboardBreakpoint): boolean {
  return DASHBOARD_GRID_COLS[breakpoint] === DASHBOARD_PERSIST_COLS;
}

export type WidgetSize = { w: number; h: number };
export type GridItem = WidgetLayoutItem & {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isResizable?: boolean;
};
export type DashboardGridLayouts = Record<DashboardBreakpoint, GridItem[]>;

function byPosition(items: GridItem[]): GridItem[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Full-width vertical stack (phones). */
function stackLayout(items: GridItem[], cols: number): GridItem[] {
  let y = 0;
  return byPosition(items).map((item) => {
    const placed = { ...item, x: 0, y, w: cols };
    y += item.h;
    return placed;
  });
}

/** Clamp widths and reflow left → right into rows (small tablets). */
function clampAndReflow(items: GridItem[], cols: number, minSizes?: Record<string, WidgetSize>): GridItem[] {
  const result: GridItem[] = [];
  let y = 0;
  let x = 0;
  let rowH = 0;
  for (const item of byPosition(items)) {
    const minW = Math.min(minSizes?.[item.i]?.w ?? 1, cols);
    const w = Math.min(Math.max(item.w, minW), cols);
    if (x > 0 && x + w > cols) {
      y += rowH;
      x = 0;
      rowH = 0;
    }
    result.push({ ...item, x, y, w });
    rowH = Math.max(rowH, item.h);
    x += w;
    if (x >= cols) {
      y += rowH;
      x = 0;
      rowH = 0;
    }
  }
  return result;
}

export function generateResponsiveLayouts(
  items: GridItem[],
  minSizes?: Record<string, WidgetSize>,
  maxSizes?: Record<string, WidgetSize>,
): DashboardGridLayouts {
  const visible = items.filter((item) => item.visible !== false);
  const bound = (list: GridItem[], cols: number) =>
    list.map((item) => {
      const min = minSizes?.[item.i];
      const max = maxSizes?.[item.i];
      if (!min && !max) return item;
      return {
        ...item,
        ...(min ? { minW: Math.min(min.w, cols), minH: min.h } : {}),
        ...(max ? { maxW: Math.min(max.w, cols), maxH: max.h } : {}),
      };
    });
  // Desktop keeps author positions: reflowing every render fights a controlled drag.
  return {
    lg: bound(visible, DASHBOARD_GRID_COLS.lg),
    md: bound(visible, DASHBOARD_GRID_COLS.md),
    sm: bound(clampAndReflow(visible, DASHBOARD_GRID_COLS.sm, minSizes), DASHBOARD_GRID_COLS.sm),
    xs: bound(stackLayout(visible, DASHBOARD_GRID_COLS.xs), DASHBOARD_GRID_COLS.xs),
    xxs: bound(stackLayout(visible, DASHBOARD_GRID_COLS.xxs), DASHBOARD_GRID_COLS.xxs),
  };
}
