/**
 * Shared list-page table column contract (ported from Kloqra DataTableList).
 *
 * Layout:
 *   PageHeader
 *   AdminListToolbar — search | filters | tableTools | actions
 *   DataTableList — loading | empty | no-results | scroll + rows + pagination
 *
 * True-empty (`sourceCount === 0`): hide toolbar via `showListChrome`.
 * Render order: pinned:start → ordered visible unpinned → pinned:end.
 */

export type DataTableColumnDef = {
  id: string;
  label: string;
  /** Default true. When false, column cannot be hidden. */
  hideable?: boolean;
  /** Default true. */
  defaultVisible?: boolean;
  /** Row-data sort support (header click). */
  sortable?: boolean;
  /** Fixed at table edge; not reorderable; typically not hideable. */
  pinned?: "start" | "end";
};

export type DataTableSortDirection = "asc" | "desc";

export type DataTableSortState = {
  sortBy: string | undefined;
  sortDir: DataTableSortDirection | undefined;
};

export function defaultVisibleColumnOrder(columns: readonly DataTableColumnDef[]): string[] {
  const start = columns.filter((c) => c.pinned === "start").map((c) => c.id);
  const middle = columns.filter((c) => !c.pinned && c.defaultVisible !== false).map((c) => c.id);
  const end = columns.filter((c) => c.pinned === "end").map((c) => c.id);
  return [...start, ...middle, ...end];
}

export function sanitizeColumnOrder(
  columns: readonly DataTableColumnDef[],
  stored: string[] | null | undefined,
): string[] {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const defaults = defaultVisibleColumnOrder(columns);
  if (!stored?.length) return defaults;

  const seen = new Set<string>();
  const middle: string[] = [];
  for (const id of stored) {
    const def = byId.get(id);
    if (!def || seen.has(id) || def.pinned) continue;
    seen.add(id);
    middle.push(id);
  }

  for (const def of columns) {
    if (def.pinned || def.hideable !== false || seen.has(def.id)) continue;
    if (def.defaultVisible === false) continue;
    seen.add(def.id);
    middle.push(def.id);
  }

  const start = columns.filter((c) => c.pinned === "start").map((c) => c.id);
  const end = columns.filter((c) => c.pinned === "end").map((c) => c.id);
  const next = [...start, ...middle, ...end];
  return next.length > 0 ? next : defaults;
}

export function cycleSortState(current: DataTableSortState, columnId: string): DataTableSortState {
  if (current.sortBy !== columnId) {
    return { sortBy: columnId, sortDir: "asc" };
  }
  if (current.sortDir === "asc") {
    return { sortBy: columnId, sortDir: "desc" };
  }
  return { sortBy: undefined, sortDir: undefined };
}
