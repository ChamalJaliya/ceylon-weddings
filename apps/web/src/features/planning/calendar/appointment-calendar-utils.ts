/** Appointment calendar layout math (adapted from Kloqra timesheet calendar-utils). */

export const TZ = "Asia/Colombo";
/** Full day — early mornings and late evenings stay on the grid. */
export const CALENDAR_START_HOUR = 0;
export const CALENDAR_END_HOUR = 24;
export const SLOT_MINUTES = 30;
export const FINE_SNAP_MINUTES = 15;
/** Fixed px per hour so gutter labels and day tracks stay 1:1. */
export const HOUR_PX = 48;
/** Horizontal day-row height (taller than a single hour so bars stay readable). */
export const DAY_ROW_PX = 88;
export const LAYOUT_STORAGE_KEY = "cw-calendar-layout";

export function hourCount() {
  return CALENDAR_END_HOUR - CALENDAR_START_HOUR;
}

export function trackHeightPx() {
  return hourCount() * HOUR_PX;
}

export function trackWidthPx() {
  return hourCount() * HOUR_PX;
}

export type CalendarOrientation = "vertical" | "horizontal";

export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getVisibleMinutes() {
  return (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
}

export function buildHourMarks() {
  return Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }, (_, i) => CALENDAR_START_HOUR + i);
}

export function buildSlotRows() {
  const rows: { hour: number; minute: number }[] = [];
  for (let hour = CALENDAR_START_HOUR; hour < CALENDAR_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      rows.push({ hour, minute });
    }
  }
  return rows;
}

export function calendarDateKey(day: Date, timezone = TZ) {
  return day.toLocaleDateString("en-CA", { timeZone: timezone });
}

export function dayKeyFromIso(iso: string, timezone = TZ) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: timezone });
}

export function getZoneHourAndMinute(date: Date, timezone = TZ) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return { hour: hour === 24 ? 0 : hour, minute };
}

export function minutesFromCalendarStart(date: Date, timezone = TZ) {
  const { hour, minute } = getZoneHourAndMinute(date, timezone);
  return hour * 60 + minute - CALENDAR_START_HOUR * 60;
}

export function getTimezoneOffsetMs(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    let hour = getVal("hour");
    if (hour === 24) hour = 0;
    const tzDateUtc = Date.UTC(
      getVal("year"),
      getVal("month") - 1,
      getVal("day"),
      hour,
      getVal("minute"),
      getVal("second"),
    );
    return tzDateUtc - date.getTime();
  } catch {
    return 0;
  }
}

/** Combine a local calendar date + hour/minute into an absolute Date in Colombo. */
export function combineDayAndTime(day: Date, hour: number, minute: number, timezone = TZ) {
  const key = calendarDateKey(day, timezone);
  const [y, m, d] = key.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  const offsetMs = getTimezoneOffsetMs(guess, timezone);
  return new Date(guess.getTime() - offsetMs);
}

export function toDateTimeLocalString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Block placement along the time axis (same % for both orientations).
 * Vertical: top/height · Horizontal: left/width
 */
export function blockStyle(start: Date, end: Date, timezone = TZ) {
  const total = getVisibleMinutes();
  const startMin = Math.max(0, minutesFromCalendarStart(start, timezone));
  let endMin = minutesFromCalendarStart(end, timezone);
  if (end.getTime() > start.getTime() && endMin === 0) endMin = total;
  endMin = Math.min(total, endMin);
  if (endMin <= startMin) {
    return { top: "0%", height: "0%", left: "0%", width: "0%", display: "none" as const };
  }
  const startPct = `${(startMin / total) * 100}%`;
  const sizePct = `${((endMin - startMin) / total) * 100}%`;
  return { top: startPct, height: sizePct, left: startPct, width: sizePct };
}

export type LaneInterval = { id: string; start: Date; end: Date };
export type LanePlacement = { lane: number; laneCount: number };

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function packOverlappingLanes(intervals: LaneInterval[]): Map<string, LanePlacement> {
  const result = new Map<string, LanePlacement>();
  if (intervals.length === 0) return result;

  const sorted = [...intervals].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    return b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime());
  });

  const assigned = new Map<string, number>();
  const laneEnds: Date[] = [];
  for (const item of sorted) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane]! > item.start) lane += 1;
    if (lane === laneEnds.length) laneEnds.push(item.end);
    else laneEnds[lane] = item.end;
    assigned.set(item.id, lane);
  }

  const n = sorted.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]!);
    return parent[i]!;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (intervalsOverlap(sorted[i]!.start, sorted[i]!.end, sorted[j]!.start, sorted[j]!.end)) {
        union(i, j);
      }
    }
  }
  const clusterMax = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const lane = assigned.get(sorted[i]!.id) ?? 0;
    clusterMax.set(root, Math.max(clusterMax.get(root) ?? 0, lane + 1));
  }
  for (let i = 0; i < n; i++) {
    const id = sorted[i]!.id;
    const lane = assigned.get(id) ?? 0;
    result.set(id, { lane, laneCount: clusterMax.get(find(i)) ?? 1 });
  }
  return result;
}

export function laneCrossAxisStyle(placement: LanePlacement | undefined, gutterPct = 1) {
  const lane = placement?.lane ?? 0;
  const laneCount = Math.max(1, placement?.laneCount ?? 1);
  const raw = 100 / laneCount;
  const sizePct = Math.max(raw - gutterPct, raw * 0.85);
  const offsetPct = lane * raw + gutterPct / 2;
  return { offsetPct, sizePct };
}

function pointerAlongAxisToTime(
  day: Date,
  clientPos: number,
  axisStart: number,
  axisSize: number,
  snapMinutes = SLOT_MINUTES,
  timezone = TZ,
) {
  const step = Math.max(1, snapMinutes);
  const ratio = Math.max(0, Math.min(1, (clientPos - axisStart) / Math.max(axisSize, 1)));
  const total = getVisibleMinutes();
  const slotCount = Math.floor(total / step);
  const slotIndex = Math.min(slotCount - 1, Math.round(ratio * slotCount));
  const totalMinFromStart = slotIndex * step;
  const hour = CALENDAR_START_HOUR + Math.floor(totalMinFromStart / 60);
  const minute = totalMinFromStart % 60;
  return combineDayAndTime(day, hour, minute, timezone);
}

export function pointerYToTime(
  day: Date,
  clientY: number,
  columnTop: number,
  columnHeight: number,
  snapMinutes = SLOT_MINUTES,
) {
  return pointerAlongAxisToTime(day, clientY, columnTop, columnHeight, snapMinutes);
}

export function pointerXToTime(
  day: Date,
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  snapMinutes = SLOT_MINUTES,
) {
  return pointerAlongAxisToTime(day, clientX, trackLeft, trackWidth, snapMinutes);
}

export function clipAppointmentToDay(
  startsAt: string,
  endsAt: string,
  day: Date,
  timezone = TZ,
): { start: Date; end: Date } | null {
  const dayStart = combineDayAndTime(day, 0, 0, timezone);
  const dayEnd = combineDayAndTime(addDays(day, 1), 0, 0, timezone);
  const start = new Date(Math.max(new Date(startsAt).getTime(), dayStart.getTime()));
  const end = new Date(Math.min(new Date(endsAt).getTime(), dayEnd.getTime()));
  if (end <= start) return null;
  return { start, end };
}

export function readStoredLayout(): CalendarOrientation {
  if (typeof window === "undefined") return "vertical";
  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return raw === "horizontal" ? "horizontal" : "vertical";
}

export function writeStoredLayout(layout: CalendarOrientation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
}

export function formatDayHeader(day: Date) {
  return day.toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "short" });
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function nowPositionPercent(now = new Date(), timezone = TZ): number | null {
  const { hour, minute } = getZoneHourAndMinute(now, timezone);
  if (hour < CALENDAR_START_HOUR || hour >= CALENDAR_END_HOUR) return null;
  const total = getVisibleMinutes();
  const mins = hour * 60 + minute - CALENDAR_START_HOUR * 60;
  return (mins / total) * 100;
}
