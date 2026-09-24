import type { CompletenessResult } from "../common";
import type { AppointmentKind, Meal, Payer, RsvpStatus, GuestSide } from "./enums";
import type { Event } from "./events";
import type { BudgetLine } from "./budget";
import {
  GUEST_IMPORT_COLUMN_ALIASES,
  guestImportRowSchema,
  type GuestHousehold,
  type GuestImportRow,
} from "./guests";
import type { WeddingVendor } from "./team";
import type {
  GuestListSummary,
  HubStats,
  PayerPot,
  PlateSummary,
} from "./presentation";
import type {
  Appointment,
  CreateAppointmentBody,
  NekathAppointmentSpec,
} from "./appointments";
import type { SeatingPlan, SeatingSummary } from "./seating";

/** Fallback core-team slugs when VendorType.coreTeam is unavailable. */
export const DEFAULT_CORE_TEAM_CATEGORY_SLUGS = [
  "VENUE",
  "PHOTO_VIDEO",
  "CATERER",
  "FLORIST_DECOR",
] as const;

function heads(household: Pick<GuestHousehold, "plusCount">) {
  return 1 + Math.max(0, household.plusCount);
}

export function plateSummary(
  households: GuestHousehold[],
  estimate: number,
  eventId?: string | null,
): PlateSummary {
  const scoped = eventId
    ? households.filter((h) => (h.invites ?? []).some((inv) => inv.eventId === eventId))
    : households;

  const statusOf = (h: GuestHousehold): RsvpStatus => {
    if (!eventId) return h.status;
    return (h.invites ?? []).find((inv) => inv.eventId === eventId)?.status ?? h.status;
  };

  let confirmedHeads = 0;
  let consideringHeads = 0;
  let declinedHeads = 0;
  let invitedHeads = 0;
  const mealMap = new Map<Meal | "NONE", number>();

  for (const h of scoped) {
    const count = heads(h);
    const status = statusOf(h);
    if (status === "CONFIRMED" || status === "WALK_IN") confirmedHeads += count;
    else if (status === "DECLINED") declinedHeads += count;
    else if (status === "INVITED") invitedHeads += count;
    else consideringHeads += count;

    if (status === "CONFIRMED" || status === "WALK_IN" || status === "MAYBE") {
      const key = h.meal ?? "NONE";
      mealMap.set(key, (mealMap.get(key) ?? 0) + count);
    }
  }

  return {
    estimate,
    confirmedHeads,
    consideringHeads,
    declinedHeads,
    invitedHeads,
    bufferGap: estimate - confirmedHeads - consideringHeads,
    byMeal: [...mealMap.entries()].map(([meal, mealHeads]) => ({
      meal: meal === "NONE" ? null : meal,
      heads: mealHeads,
    })),
    eventId: eventId ?? null,
  };
}

export function payerRollup(lines: BudgetLine[]): PayerPot[] {
  const pots = new Map<Payer, PayerPot>();
  for (const payer of ["COUPLE", "BRIDE_FAMILY", "GROOM_FAMILY"] as Payer[]) {
    pots.set(payer, { payer, plannedLkr: 0, spentLkr: 0, paidLkr: 0, unpaidLkr: 0 });
  }
  for (const line of lines) {
    const pot = pots.get(line.payer)!;
    pot.plannedLkr += line.plannedLkr;
    pot.spentLkr += line.spentLkr;
    pot.paidLkr += line.paidLkr;
    pot.unpaidLkr += Math.max(0, line.spentLkr - line.paidLkr);
  }
  return [...pots.values()];
}

export function guestListSummary(households: GuestHousehold[]): GuestListSummary {
  const byStatus = new Map<RsvpStatus, { households: number; heads: number }>();
  const bySide = new Map<GuestSide, { households: number; heads: number }>();
  const mealMap = new Map<Meal | "NONE", number>();
  let totalHeads = 0;

  for (const h of households) {
    const count = heads(h);
    totalHeads += count;
    const st = byStatus.get(h.status) ?? { households: 0, heads: 0 };
    st.households += 1;
    st.heads += count;
    byStatus.set(h.status, st);

    const side = bySide.get(h.side) ?? { households: 0, heads: 0 };
    side.households += 1;
    side.heads += count;
    bySide.set(h.side, side);

    const key = h.meal ?? "NONE";
    mealMap.set(key, (mealMap.get(key) ?? 0) + count);
  }

  return {
    households: households.length,
    heads: totalHeads,
    byStatus: [...byStatus.entries()].map(([status, v]) => ({ status, ...v })),
    bySide: [...bySide.entries()].map(([side, v]) => ({ side, ...v })),
    byMeal: [...mealMap.entries()].map(([meal, mealHeads]) => ({
      meal: meal === "NONE" ? null : meal,
      heads: mealHeads,
    })),
  };
}

export function missingTeamCategories(
  team: WeddingVendor[],
  coreSlugs: readonly string[] = DEFAULT_CORE_TEAM_CATEGORY_SLUGS,
): string[] {
  const bookedOrLinked = new Set(team.map((t) => t.category));
  return coreSlugs.filter((cat) => !bookedOrLinked.has(cat));
}

export function hubStats(input: {
  events: Event[];
  tasks: Array<{ status: string }>;
  households: GuestHousehold[];
  team: WeddingVendor[];
  budgetLines: BudgetLine[];
  budgetLkr: number;
  guestCountEstimate: number;
  musicPlans?: Array<{ ready?: boolean | null; mustCount?: number | null; cueCount?: number | null }>;
  moodboards?: Array<{ ready?: boolean | null; elementCount?: number | null }> | null;
  /** Active VendorType.coreTeam slugs; falls back to DEFAULT_CORE_TEAM_CATEGORY_SLUGS. */
  coreCategorySlugs?: readonly string[];
  now?: Date;
}): HubStats {
  const now = input.now ?? new Date();
  const upcoming = [...input.events]
    .map((event) => {
      const at = event.nekathAt ?? event.startsAt;
      return at ? { event, at: new Date(at) } : null;
    })
    .filter((row): row is { event: Event; at: Date } => Boolean(row && !Number.isNaN(row.at.getTime())))
    .filter((row) => row.at.getTime() >= now.getTime() - 60_000)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const next = upcoming[0] ?? null;
  const plates = plateSummary(input.households, input.guestCountEstimate);
  const unpaidLkr = input.budgetLines.reduce((sum, line) => sum + Math.max(0, line.spentLkr - line.paidLkr), 0);
  const spent = input.budgetLines.reduce((sum, line) => sum + line.spentLkr, 0);
  const musicPlans = input.musicPlans ?? [];
  const musicReadyPlans = musicPlans.filter(
    (plan) =>
      plan.ready === true ||
      (plan.mustCount ?? 0) >= 1 ||
      (plan.cueCount ?? 0) >= 3,
  ).length;
  const moodboards = input.moodboards ?? [];
  const moodboardReadyCount = moodboards.filter(
    (board) => board.ready === true || (board.elementCount ?? 0) >= 1,
  ).length;

  return {
    daysToNextEvent: next
      ? Math.max(0, Math.floor((next.at.getTime() - now.getTime()) / 86_400_000))
      : null,
    nextEventId: next?.event.id ?? null,
    nextEventName: next?.event.name ?? null,
    nextEventAt: next?.at.toISOString() ?? null,
    tasksOpen: input.tasks.filter((t) => t.status !== "DONE").length,
    tasksDone: input.tasks.filter((t) => t.status === "DONE").length,
    rsvpConfirmed: input.households.filter((h) => h.status === "CONFIRMED").length,
    rsvpTotal: input.households.length,
    teamBooked: input.team.filter((t) => t.status === "BOOKED").length,
    teamTotal: input.team.length,
    budgetSpentLkr: spent,
    budgetCapLkr: input.budgetLkr,
    unpaidLkr,
    plateConfirmedHeads: plates.confirmedHeads,
    plateEstimate: input.guestCountEstimate,
    missingCategories: missingTeamCategories(
      input.team,
      input.coreCategorySlugs?.length ? input.coreCategorySlugs : DEFAULT_CORE_TEAM_CATEGORY_SLUGS,
    ),
    musicReadyPlans,
    musicPlanCount: musicPlans.length,
    moodboardReadyCount,
    moodboardCount: moodboards.length,
  };
}

export function nekathAppointmentSpecs(event: Pick<Event, "name" | "kind" | "nekathAt" | "startsAt">): NekathAppointmentSpec[] {
  const anchor = event.nekathAt ?? event.startsAt;
  if (!anchor) return [];

  const specs: Array<{
    title: string;
    kind: AppointmentKind;
    offsetMinutes: number;
    durationMinutes: number;
    color: string;
    ownerLabel: string;
  }> = [
    {
      title: "Bridal dresser arrives",
      kind: "DAY_OF",
      offsetMinutes: -180,
      durationMinutes: 90,
      color: "#C4A574",
      ownerLabel: "Bridal dresser",
    },
    {
      title: "Wedding cars ready",
      kind: "DAY_OF",
      offsetMinutes: -90,
      durationMinutes: 45,
      color: "#1F4B73",
      ownerLabel: "Transport",
    },
    {
      title: `${event.name} ceremony`,
      kind: "CEREMONY",
      offsetMinutes: 0,
      durationMinutes: 75,
      color: "#7A1F2B",
      ownerLabel: "Couple",
    },
    {
      title: "Guest plates / seating",
      kind: "DAY_OF",
      offsetMinutes: 90,
      durationMinutes: 120,
      color: "#1F4D3A",
      ownerLabel: "Amma / hosts",
    },
  ];

  return specs.map((spec) => ({
    title: spec.title,
    kind: spec.kind,
    offsetMinutes: spec.offsetMinutes,
    durationMinutes: spec.durationMinutes,
    color: spec.color,
    ownerLabel: spec.ownerLabel,
  }));
}

export function nekathAppointmentsFromSpecs(
  event: Pick<Event, "id" | "name" | "nekathAt" | "startsAt" | "venueName" | "address">,
  specs: NekathAppointmentSpec[],
): Array<{
  title: string;
  kind: AppointmentKind;
  startsAt: string;
  endsAt: string;
  venueName: string | null;
  address: string | null;
  color: string | null;
  reminderMinutes: number;
  eventId: string;
  sortOrder: number;
  ownerLabel: string | null;
}> {
  const anchorIso = event.nekathAt ?? event.startsAt;
  if (!anchorIso) return [];
  const anchor = new Date(anchorIso).getTime();
  return specs.map((spec, index) => {
    const start = new Date(anchor + spec.offsetMinutes * 60_000);
    const end = new Date(start.getTime() + spec.durationMinutes * 60_000);
    return {
      title: spec.title,
      kind: spec.kind,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      venueName: event.venueName,
      address: event.address,
      color: spec.color,
      reminderMinutes: 30,
      eventId: event.id,
      sortOrder: index,
      ownerLabel: spec.ownerLabel ?? null,
    };
  });
}

export function agendaForEvent(appointments: Appointment[], eventId: string): Appointment[] {
  return appointments
    .filter((a) => a.eventId === eventId)
    .slice()
    .sort((a, b) => {
      const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (order !== 0) return order;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
}

export function teamContactSheet(team: WeddingVendor[]) {
  return team
    .filter((v) => v.status === "BOOKED")
    .map((v) => ({
      vendorId: v.vendorId,
      name: v.name,
      category: v.category,
      whatsapp: v.whatsapp ?? null,
    }));
}

/** Sentinel value for “no vendor” selects (`__none__` → null). */
export const TEAM_VENDOR_NONE = "__none__" as const;

export function teamVendorPickerOptions(team: WeddingVendor[]) {
  return team
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((v) => ({
      value: v.vendorId,
      label: `${v.name} · ${v.status.replaceAll("_", " ")}`,
      whatsapp: v.whatsapp ?? null,
    }));
}

export const REMINDER_PRESETS = [
  { minutes: 0, labelKey: "reminderOff" as const },
  { minutes: 15, labelKey: "reminder15" as const },
  { minutes: 30, labelKey: "reminder30" as const },
  { minutes: 60, labelKey: "reminder60" as const },
  { minutes: 1440, labelKey: "reminder1Day" as const },
] as const;

export function reminderPresetOptions() {
  return REMINDER_PRESETS.map((preset) => ({
    value: String(preset.minutes),
    minutes: preset.minutes,
    labelKey: preset.labelKey,
  }));
}

export function duplicateAppointmentBody(
  appt: Appointment,
  overrides?: Partial<CreateAppointmentBody>,
): CreateAppointmentBody {
  return {
    title: appt.title,
    kind: appt.kind,
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    venueName: appt.venueName,
    address: appt.address,
    reminderMinutes: appt.reminderMinutes,
    notes: appt.notes,
    vendorId: appt.vendorId,
    eventId: appt.eventId ?? null,
    color: appt.color,
    sortOrder: appt.sortOrder,
    ownerLabel: appt.ownerLabel ?? null,
    ...overrides,
  };
}

export function shiftAppointmentWindow(startsAt: string, endsAt: string, deltaMs: number) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  return {
    startsAt: new Date(start + deltaMs).toISOString(),
    endsAt: new Date(end + deltaMs).toISOString(),
  };
}

export function seatingSummary(
  plan: SeatingPlan,
  households: Array<Pick<GuestHousehold, "id" | "plusCount">>,
): SeatingSummary {
  const assigned = new Set<string>();
  let seatedHeads = 0;
  let capacity = 0;
  let overbookedTables = 0;
  const tables = (plan.tables ?? []).map((table) => {
    const seated = (table.assignments ?? []).reduce((sum, a) => {
      assigned.add(a.householdId);
      return sum + a.seatsUsed;
    }, 0);
    capacity += table.capacity;
    seatedHeads += seated;
    const overbooked = seated > table.capacity;
    if (overbooked) overbookedTables += 1;
    return {
      tableId: table.id,
      name: table.name,
      capacity: table.capacity,
      seated,
      overbooked,
    };
  });

  let unassignedHouseholds = 0;
  let unassignedHeads = 0;
  for (const h of households) {
    if (assigned.has(h.id)) continue;
    unassignedHouseholds += 1;
    unassignedHeads += 1 + Math.max(0, h.plusCount);
  }

  return {
    seatedHeads,
    capacity,
    unassignedHouseholds,
    unassignedHeads,
    overbookedTables,
    tables,
  };
}

export function normalizeGuestImportRow(raw: Record<string, unknown>): GuestImportRow | { error: string } {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const alias = GUEST_IMPORT_COLUMN_ALIASES[key.trim().toLowerCase().replace(/[\s_]+/g, "")];
    if (!alias || alias === "ignore") continue;
    if (alias === "eventNames" && typeof value === "string") {
      mapped.eventNames = value
        .split(/[|;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }
    if (alias === "plusCount") {
      const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
      mapped.plusCount = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      continue;
    }
    mapped[alias] = typeof value === "string" ? value.trim() : value;
  }
  if (!mapped.label && mapped.headName) mapped.label = mapped.headName;
  if (!mapped.headName && mapped.label) mapped.headName = mapped.label;
  const parsed = guestImportRowSchema.safeParse(mapped);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid row" };
  }
  return parsed.data;
}

export function whatsappInviteUrl(input: {
  phone: string;
  partnerOneName?: string;
  partnerTwoName?: string;
  rsvpUrl?: string;
  locale?: string;
  message?: string;
}) {
  const digits = input.phone.replace(/\D/g, "");
  if (!digits) return null;
  const text =
    input.message?.trim() ||
    (input.locale === "si"
      ? `ආයුබෝවන්! ${input.partnerOneName ?? ""} සහ ${input.partnerTwoName ?? ""} ගේ මංගල උත්සවයට ඔබව ආරාධනා කරමු. RSVP: ${input.rsvpUrl ?? ""}`
      : `Ayubowan! You're invited to ${input.partnerOneName ?? ""} & ${input.partnerTwoName ?? ""}'s wedding. Please RSVP: ${input.rsvpUrl ?? ""}`);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatWeddingDateLabel(date: string | null | undefined, locale = "en-LK") {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

export function weddingCompleteness(wedding: {
  partnerOneName?: string | null;
  partnerTwoName?: string | null;
  date?: string | null;
  city?: string | null;
  guestCountEstimate?: number | null;
  budgetLkr?: number | null;
  websiteEnabled?: boolean | null;
  websiteFaq?: string | null;
  travelNotes?: string | null;
  events?: Array<{ id?: string; startsAt?: string | null; name?: string | null }> | null;
  budgetLines?: Array<{ id?: string }> | null;
  team?: Array<{ status?: string | null }> | null;
  planningFromOverseas?: boolean | null;
  members?: Array<{ role?: string | null }> | null;
  inviteTemplateCount?: number | null;
  seatingEventIds?: string[] | null;
  guestEventIds?: string[] | null;
  musicPlans?: Array<{ ready?: boolean | null; mustCount?: number | null; cueCount?: number | null }> | null;
  moodboards?: Array<{ ready?: boolean | null; elementCount?: number | null }> | null;
}): CompletenessResult {
  const checks: Array<{ key: string; ok: boolean }> = [
    { key: "partners", ok: Boolean(wedding.partnerOneName?.trim() && wedding.partnerTwoName?.trim()) },
    { key: "date", ok: Boolean(wedding.date) },
    { key: "city", ok: Boolean(wedding.city?.trim()) },
    {
      key: "events",
      ok: (wedding.events ?? []).some((event) => Boolean(event.startsAt) && Boolean(event.name?.trim())),
    },
    { key: "guests", ok: (wedding.guestCountEstimate ?? 0) >= 20 },
    {
      key: "budget",
      ok: (wedding.budgetLkr ?? 0) > 0 || (wedding.budgetLines?.length ?? 0) > 0,
    },
    {
      key: "website",
      ok:
        !wedding.websiteEnabled ||
        (Boolean(wedding.websiteFaq?.trim()) && Boolean(wedding.travelNotes?.trim())),
    },
    {
      key: "family",
      ok: !wedding.planningFromOverseas || (wedding.members ?? []).some((m) => m.role === "FAMILY"),
    },
    {
      key: "inviteTemplate",
      ok: !wedding.websiteEnabled || (wedding.inviteTemplateCount ?? 0) > 0,
    },
    {
      key: "seating",
      ok: (() => {
        if (!wedding.websiteEnabled) return true;
        const guestEvents = [...new Set(wedding.guestEventIds ?? [])];
        if (guestEvents.length === 0) return true;
        const seated = new Set(wedding.seatingEventIds ?? []);
        return guestEvents.every((id) => seated.has(id));
      })(),
    },
    {
      key: "music",
      ok: (wedding.musicPlans ?? []).some(
        (plan) =>
          plan.ready === true ||
          (plan.mustCount ?? 0) >= 1 ||
          (plan.cueCount ?? 0) >= 3,
      ),
    },
    {
      key: "moodboard",
      ok: (wedding.moodboards ?? []).some(
        (board) => board.ready === true || (board.elementCount ?? 0) >= 1,
      ),
    },
  ];
  const missing = checks.filter((item) => !item.ok).map((item) => item.key);
  const score = checks.length - missing.length;
  return { score, total: checks.length, ready: missing.length === 0, missing };
}
