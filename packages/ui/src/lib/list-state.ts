/**
 * List empty-state rules (ported from Kloqra's DataTableList, QA-hardened):
 *
 * - `sourceCount === 0`  → "empty": nothing exists yet. Hide toolbar, stats and
 *   top CTA; the empty state's own action is the only call to action.
 * - `sourceCount > 0 && filteredCount === 0` → "no-results": keep the toolbar so
 *   filters stay reachable, and offer "Clear filters".
 * - otherwise `null`: render rows.
 *
 * Keep chrome visible while `loading` so filters don't flash away.
 */
export type ListEmptyMode = "empty" | "no-results" | null;

export function getListEmptyMode({
  sourceCount,
  filteredCount,
}: {
  sourceCount: number;
  filteredCount: number;
}): ListEmptyMode {
  if (sourceCount <= 0) return "empty";
  if (filteredCount <= 0) return "no-results";
  return null;
}

export function showListChrome(mode: ListEmptyMode, loading = false): boolean {
  return loading || mode !== "empty";
}

/**
 * Server-filtered lists only know `total` for the current query. Treat it as a
 * true empty only when the default (unfiltered) view returns nothing.
 */
export function serverSourceCount(total: number, isDefaultView: boolean): number {
  return total === 0 && isDefaultView ? 0 : Math.max(total, 1);
}
