import { Prisma } from "@ceylonweddings/database";
import { INSIGHT_WINDOW_DAYS, type DailyPoint, type PeriodTotals } from "@ceylonweddings/contracts";

/** Dashboard calendar days follow Sri Lanka time, like the rest of the planning tools. */
export const INSIGHT_TIMEZONE = "Asia/Colombo";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Colombo calendar day (YYYY-MM-DD) for an instant. */
export function colomboDay(at: Date): string {
  return at.toLocaleDateString("en-CA", { timeZone: INSIGHT_TIMEZONE });
}

/**
 * Two back-to-back windows of `days` Colombo calendar days ending today:
 * `previousKeys` then `keys` (oldest first). `since` bounds the SQL scan
 * with a one-day margin so the oldest bucket is complete.
 */
export function insightWindow(days = INSIGHT_WINDOW_DAYS, now = new Date()) {
  const all: string[] = [];
  for (let i = days * 2 - 1; i >= 0; i -= 1) all.push(colomboDay(new Date(now.getTime() - i * DAY_MS)));
  return {
    days,
    previousKeys: all.slice(0, days),
    keys: all.slice(days),
    since: new Date(now.getTime() - (days * 2 + 1) * DAY_MS),
  };
}

export type InsightWindow = ReturnType<typeof insightWindow>;
export type DayCountRow = { day: string; count: number };

/** Zero-filled current series plus current / previous totals from grouped day rows. */
export function seriesWithTotals(
  window: InsightWindow,
  rows: DayCountRow[],
): { series: DailyPoint[]; totals: PeriodTotals } {
  const byDay = new Map(rows.map((row) => [row.day, Number(row.count)]));
  const series = window.keys.map((date) => ({ date, value: byDay.get(date) ?? 0 }));
  const previous = window.previousKeys.reduce((sum, key) => sum + (byDay.get(key) ?? 0), 0);
  const current = series.reduce((sum, point) => sum + point.value, 0);
  return { series, totals: { current, previous } };
}

/**
 * Per-day counts on a table with a `createdAt` column, grouped by Colombo calendar
 * day. `table` is a trusted model name; `where` is an extra parameterised condition.
 */
export function dayCountsSql(table: string, since: Date, where: Prisma.Sql = Prisma.sql`TRUE`): Prisma.Sql {
  return Prisma.sql`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${INSIGHT_TIMEZONE})::date, 'YYYY-MM-DD') AS day,
           count(*)::int AS count
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE "createdAt" >= ${since} AND ${where}
    GROUP BY 1`;
}
