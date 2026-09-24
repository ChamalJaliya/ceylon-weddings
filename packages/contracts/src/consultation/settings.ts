import { z } from "zod";
import { CONSULTATION_WEEKDAY_KEYS, consultationModeSchema } from "./enums";
import type { ConsultationWeekdayKey } from "./enums";

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const consultationWindowSchema = z.object({
  start: z.string().regex(TIME_OF_DAY, "Use HH:MM"),
  end: z.string().regex(TIME_OF_DAY, "Use HH:MM"),
});
export type ConsultationWindow = z.infer<typeof consultationWindowSchema>;

export const consultationWeeklySchema = z.object({
  sun: z.array(consultationWindowSchema).max(4).default([]),
  mon: z.array(consultationWindowSchema).max(4).default([]),
  tue: z.array(consultationWindowSchema).max(4).default([]),
  wed: z.array(consultationWindowSchema).max(4).default([]),
  thu: z.array(consultationWindowSchema).max(4).default([]),
  fri: z.array(consultationWindowSchema).max(4).default([]),
  sat: z.array(consultationWindowSchema).max(4).default([]),
});
export type ConsultationWeekly = z.infer<typeof consultationWeeklySchema>;

export const consultationIntroSchema = z.object({
  title: z.string().max(120).default("Book a free consultation"),
  body: z
    .string()
    .max(600)
    .default(
      "Talk to the Ceylon Weddings team about where to start, which vendors fit your budget, or anything you are stuck on.",
    ),
  durationNote: z.string().max(160).default("Free 30 minute call. No account needed."),
});
export type ConsultationIntro = z.infer<typeof consultationIntroSchema>;

export const consultationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  timezone: z.string().min(3).max(60).default("Asia/Colombo"),
  slotMinutes: z.number().int().min(10).max(240).default(30),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  leadTimeHours: z.number().int().min(0).max(720).default(12),
  horizonDays: z.number().int().min(1).max(120).default(21),
  maxPerDay: z.number().int().min(1).max(40).default(6),
  autoConfirm: z.boolean().default(true),
  modes: z.array(consultationModeSchema).min(1).default(["VIDEO", "PHONE", "WHATSAPP"]),
  defaultMeetingUrl: z.string().max(500).nullable().optional(),
  weekly: consultationWeeklySchema.default({
    sun: [],
    mon: [{ start: "09:00", end: "17:00" }],
    tue: [{ start: "09:00", end: "17:00" }],
    wed: [{ start: "09:00", end: "17:00" }],
    thu: [{ start: "09:00", end: "17:00" }],
    fri: [{ start: "09:00", end: "17:00" }],
    sat: [{ start: "09:00", end: "13:00" }],
  }),
  blackoutDates: z.array(z.string().regex(DATE_KEY, "Use YYYY-MM-DD")).max(120).default([]),
  intro: consultationIntroSchema.default({
    title: "Book a free consultation",
    body: "Talk to the Ceylon Weddings team about where to start, which vendors fit your budget, or anything you are stuck on.",
    durationNote: "Free 30 minute call. No account needed.",
  }),
});
export type ConsultationSettings = z.infer<typeof consultationSettingsSchema>;

export const DEFAULT_CONSULTATION_SETTINGS: ConsultationSettings = consultationSettingsSchema.parse({});

/** Minutes east of UTC for the given instant in the given IANA zone. */
export function timezoneOffsetMinutes(timezone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** "YYYY-MM-DD" for an instant, as seen in the given zone. */
export function zonedDateKey(at: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

/** Turn a wall-clock time in the given zone into a UTC instant. */
export function zonedTimeToUtc(dateKey: string, minutesOfDay: number, timezone: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const wallClock = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) + minutesOfDay * 60_000;
  let timestamp = wallClock;
  // Two passes settle zones whose offset changes across the guessed instant.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = wallClock - timezoneOffsetMinutes(timezone, new Date(timestamp)) * 60_000;
    if (next === timestamp) break;
    timestamp = next;
  }
  return new Date(timestamp);
}

export function consultationWeekdayKey(dateKey: string, timezone: string): ConsultationWeekdayKey {
  const noon = zonedTimeToUtc(dateKey, 12 * 60, timezone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" })
    .format(noon)
    .toLowerCase();
  const match = CONSULTATION_WEEKDAY_KEYS.find((key) => key === weekday);
  return match ?? "sun";
}

function minutesOfDay(value: string): number {
  const match = TIME_OF_DAY.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function addDays(dateKey: string, count: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + count));
  return next.toISOString().slice(0, 10);
}

export type ConsultationSlot = {
  startsAt: string;
  endsAt: string;
  slotKey: string;
  available: boolean;
};

export type ConsultationDay = {
  date: string;
  weekday: ConsultationWeekdayKey;
  slots: ConsultationSlot[];
};

export function consultationSlotKey(startsAt: Date | string): string {
  return new Date(startsAt).toISOString();
}

/**
 * Expand the weekly availability into concrete slots. Slots outside the lead time or already
 * booked come back with `available: false` so admin previews can show them; public responses
 * drop them.
 */
export function buildConsultationSlots(input: {
  settings: ConsultationSettings;
  from?: Date | string;
  days?: number;
  bookedKeys?: Iterable<string>;
  now?: Date;
}): ConsultationDay[] {
  const { settings } = input;
  if (!settings.enabled) return [];

  const now = input.now ?? new Date();
  const booked = new Set(input.bookedKeys ?? []);
  const timezone = settings.timezone;
  const earliest = new Date(now.getTime() + settings.leadTimeHours * 3_600_000);
  const horizonEnd = new Date(now.getTime() + settings.horizonDays * 86_400_000);

  const requestedFrom = input.from ? new Date(input.from) : now;
  const fromKey = zonedDateKey(requestedFrom.getTime() < now.getTime() ? now : requestedFrom, timezone);
  const dayCount = Math.max(1, Math.min(input.days ?? settings.horizonDays, settings.horizonDays));
  const step = settings.slotMinutes + settings.bufferMinutes;
  const blackout = new Set(settings.blackoutDates);

  const days: ConsultationDay[] = [];
  for (let index = 0; index < dayCount; index += 1) {
    const date = addDays(fromKey, index);
    const weekday = consultationWeekdayKey(date, timezone);
    if (blackout.has(date)) {
      days.push({ date, weekday, slots: [] });
      continue;
    }

    const slots: ConsultationSlot[] = [];
    let bookedToday = 0;
    for (const window of settings.weekly[weekday]) {
      const windowStart = minutesOfDay(window.start);
      const windowEnd = minutesOfDay(window.end);
      for (let start = windowStart; start + settings.slotMinutes <= windowEnd; start += step) {
        const startsAt = zonedTimeToUtc(date, start, timezone);
        if (startsAt.getTime() > horizonEnd.getTime()) continue;
        const endsAt = new Date(startsAt.getTime() + settings.slotMinutes * 60_000);
        const slotKey = consultationSlotKey(startsAt);
        const taken = booked.has(slotKey);
        if (taken) bookedToday += 1;
        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          slotKey,
          available: !taken && startsAt.getTime() >= earliest.getTime(),
        });
      }
    }

    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    if (bookedToday >= settings.maxPerDay) {
      for (const slot of slots) slot.available = false;
    }
    days.push({ date, weekday, slots });
  }

  return days;
}

/** Server-side guard: is this exact instant a bookable published slot? */
export function findConsultationSlot(
  settings: ConsultationSettings,
  startsAt: Date | string,
  options: { now?: Date; bookedKeys?: Iterable<string> } = {},
): ConsultationSlot | null {
  const target = new Date(startsAt);
  if (Number.isNaN(target.getTime())) return null;
  const date = zonedDateKey(target, settings.timezone);
  const [day] = buildConsultationSlots({
    settings,
    from: date,
    days: 1,
    now: options.now,
    bookedKeys: options.bookedKeys,
  });
  if (!day) return null;
  return day.slots.find((slot) => slot.slotKey === consultationSlotKey(target)) ?? null;
}
