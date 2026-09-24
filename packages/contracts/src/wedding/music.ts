import { z } from "zod";
import type { EventKind } from "./enums";
import { eventKindSchema } from "./enums";

export const musicListKindSchema = z.enum(["MUST", "MAYBE", "DO_NOT"]);
export type MusicListKind = z.infer<typeof musicListKindSchema>;

export const musicCueKindSchema = z.enum([
  "PROCESSIONAL",
  "ENTRANCE",
  "CEREMONY",
  "RECESSIONAL",
  "COCKTAIL",
  "FIRST_DANCE",
  "PARENT_DANCE",
  "CAKE",
  "BOUQUET",
  "PARTY",
  "LAST_DANCE",
  "TRADITIONAL",
  "CUSTOM",
]);
export type MusicCueKind = z.infer<typeof musicCueKindSchema>;

export const musicLanguageSchema = z.enum([
  "SINHALA",
  "TAMIL",
  "ENGLISH",
  "HINDI",
  "MIXED",
  "OTHER",
]);
export type MusicLanguage = z.infer<typeof musicLanguageSchema>;

export const musicVibeSchema = z.enum([
  "TRADITIONAL",
  "ROMANTIC",
  "UPBEAT",
  "BAILA",
  "RELIGIOUS",
  "SOFT",
  "PARTY",
  "CUSTOM",
]);
export type MusicVibe = z.infer<typeof musicVibeSchema>;

export const musicTrackSchema = z.object({
  id: z.string(),
  planId: z.string(),
  list: musicListKindSchema,
  title: z.string(),
  artist: z.string().nullable(),
  url: z.string().nullable(),
  language: musicLanguageSchema.nullable(),
  vibe: musicVibeSchema.nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MusicTrack = z.infer<typeof musicTrackSchema>;

export const createMusicTrackBodySchema = z.object({
  list: musicListKindSchema,
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  url: z
    .string()
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  language: musicLanguageSchema.nullable().optional(),
  vibe: musicVibeSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateMusicTrackBody = z.infer<typeof createMusicTrackBodySchema>;

export const updateMusicTrackBodySchema = createMusicTrackBodySchema.partial();
export type UpdateMusicTrackBody = z.infer<typeof updateMusicTrackBodySchema>;

export const reorderMusicTracksBodySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
export type ReorderMusicTracksBody = z.infer<typeof reorderMusicTracksBodySchema>;

export const musicCueSchema = z.object({
  id: z.string(),
  planId: z.string(),
  kind: musicCueKindSchema,
  label: z.string(),
  trackTitle: z.string().nullable(),
  trackId: z.string().nullable(),
  appointmentId: z.string().nullable(),
  offsetMinutes: z.number().int().nullable(),
  startsAt: z.string().nullable(),
  durationMinutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MusicCue = z.infer<typeof musicCueSchema>;

export const createMusicCueBodySchema = z.object({
  kind: musicCueKindSchema.default("CUSTOM"),
  label: z.string().min(1),
  trackTitle: z.string().nullable().optional(),
  trackId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
  offsetMinutes: z.number().int().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateMusicCueBody = z.infer<typeof createMusicCueBodySchema>;

export const updateMusicCueBodySchema = createMusicCueBodySchema.partial();
export type UpdateMusicCueBody = z.infer<typeof updateMusicCueBodySchema>;

export const reorderMusicCuesBodySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
export type ReorderMusicCuesBody = z.infer<typeof reorderMusicCuesBodySchema>;

export const seedMusicCueTemplatesBodySchema = z.object({
  replace: z.boolean().default(false),
});
export type SeedMusicCueTemplatesBody = z.infer<typeof seedMusicCueTemplatesBodySchema>;

export const musicPlanSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  eventId: z.string(),
  eventName: z.string().optional(),
  eventKind: eventKindSchema.optional(),
  notes: z.string().nullable(),
  vibePrimary: musicVibeSchema.nullable(),
  languages: z.array(musicLanguageSchema),
  entertainmentVendorId: z.string().nullable(),
  shareToken: z.string().nullable().optional(),
  shareEnabled: z.boolean(),
  tracks: z.array(musicTrackSchema).optional(),
  cues: z.array(musicCueSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MusicPlan = z.infer<typeof musicPlanSchema>;

export const musicPlanListSchema = z.array(musicPlanSchema);
export type MusicPlanList = z.infer<typeof musicPlanListSchema>;

export const upsertMusicPlanBodySchema = z.object({
  eventId: z.string().min(1),
  notes: z.string().nullable().optional(),
  vibePrimary: musicVibeSchema.nullable().optional(),
  languages: z.array(musicLanguageSchema).optional(),
  entertainmentVendorId: z.string().nullable().optional(),
});
export type UpsertMusicPlanBody = z.infer<typeof upsertMusicPlanBodySchema>;

export const updateMusicPlanBodySchema = z.object({
  notes: z.string().nullable().optional(),
  vibePrimary: musicVibeSchema.nullable().optional(),
  languages: z.array(musicLanguageSchema).optional(),
  entertainmentVendorId: z.string().nullable().optional(),
});
export type UpdateMusicPlanBody = z.infer<typeof updateMusicPlanBodySchema>;

export const setMusicShareBodySchema = z.object({
  enabled: z.boolean(),
  rotate: z.boolean().optional(),
});
export type SetMusicShareBody = z.infer<typeof setMusicShareBodySchema>;

export const musicPlanSummarySchema = z.object({
  planId: z.string(),
  eventId: z.string(),
  eventName: z.string().nullable().optional(),
  eventKind: eventKindSchema.nullable().optional(),
  mustCount: z.number().int(),
  maybeCount: z.number().int(),
  doNotCount: z.number().int(),
  cueCount: z.number().int(),
  shareEnabled: z.boolean(),
  ready: z.boolean(),
});
export type MusicPlanSummary = z.infer<typeof musicPlanSummarySchema>;

export const musicBriefCueSchema = z.object({
  kind: musicCueKindSchema,
  label: z.string(),
  trackTitle: z.string().nullable(),
  startsAt: z.string().nullable(),
  offsetMinutes: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number().int(),
});

export const musicBriefTrackSchema = z.object({
  list: musicListKindSchema,
  title: z.string(),
  artist: z.string().nullable(),
  url: z.string().nullable(),
  language: musicLanguageSchema.nullable(),
  vibe: musicVibeSchema.nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number().int(),
});

export const musicBriefSchema = z.object({
  eventName: z.string(),
  eventKind: eventKindSchema,
  eventStartsAt: z.string().nullable(),
  venueName: z.string().nullable(),
  notes: z.string().nullable(),
  vibePrimary: musicVibeSchema.nullable(),
  languages: z.array(musicLanguageSchema),
  cues: z.array(musicBriefCueSchema),
  mustPlay: z.array(musicBriefTrackSchema),
  maybePlay: z.array(musicBriefTrackSchema),
  doNotPlay: z.array(musicBriefTrackSchema),
});
export type MusicBrief = z.infer<typeof musicBriefSchema>;

export const musicCueTemplateSchema = z.object({
  kind: musicCueKindSchema,
  label: z.string(),
  offsetMinutes: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  notes: z.string().nullable().optional(),
});
export type MusicCueTemplate = z.infer<typeof musicCueTemplateSchema>;

export function musicCueTemplatesForEventKind(kind: EventKind): MusicCueTemplate[] {
  switch (kind) {
    case "PORUWA":
      return [
        {
          kind: "TRADITIONAL",
          label: "Magul bera / traditional entrance",
          offsetMinutes: -15,
          durationMinutes: 15,
          notes: "Live percussion as bridal party arrives",
        },
        {
          kind: "ENTRANCE",
          label: "Couple entrance to poruwa",
          offsetMinutes: 0,
          durationMinutes: 5,
        },
        {
          kind: "CEREMONY",
          label: "Ashtaka / ceremony window",
          offsetMinutes: 5,
          durationMinutes: 45,
          notes: "Keep soft traditional bed under vows",
        },
        {
          kind: "RECESSIONAL",
          label: "Leaving the poruwa",
          offsetMinutes: 55,
          durationMinutes: 10,
        },
      ];
    case "CHURCH":
      return [
        {
          kind: "PROCESSIONAL",
          label: "Processional / bridal walk",
          offsetMinutes: 0,
          durationMinutes: 8,
        },
        {
          kind: "CEREMONY",
          label: "Ceremony hymns / soft bed",
          offsetMinutes: 10,
          durationMinutes: 40,
        },
        {
          kind: "RECESSIONAL",
          label: "Recessional",
          offsetMinutes: 55,
          durationMinutes: 8,
        },
        {
          kind: "FIRST_DANCE",
          label: "First dance (if same venue)",
          offsetMinutes: 90,
          durationMinutes: 6,
        },
      ];
    case "NIKAH":
      return [
        {
          kind: "CEREMONY",
          label: "Nikah ceremony cues",
          offsetMinutes: 0,
          durationMinutes: 45,
          notes: "Confirm religious music rules with family",
        },
        {
          kind: "PARTY",
          label: "Post-ceremony soft set",
          offsetMinutes: 60,
          durationMinutes: 60,
        },
      ];
    case "WALIMA":
      return [
        {
          kind: "COCKTAIL",
          label: "Guest arrival / cocktail",
          offsetMinutes: -30,
          durationMinutes: 45,
        },
        {
          kind: "ENTRANCE",
          label: "Couple entrance",
          offsetMinutes: 0,
          durationMinutes: 8,
        },
        {
          kind: "PARTY",
          label: "Walima party set",
          offsetMinutes: 45,
          durationMinutes: 120,
        },
        {
          kind: "LAST_DANCE",
          label: "Last dance",
          offsetMinutes: 180,
          durationMinutes: 6,
        },
      ];
    case "RECEPTION":
    case "HOMECOMING":
      return [
        {
          kind: "COCKTAIL",
          label: "Cocktail / guest arrival",
          offsetMinutes: -45,
          durationMinutes: 45,
        },
        {
          kind: "ENTRANCE",
          label: "Couple grand entrance",
          offsetMinutes: 0,
          durationMinutes: 8,
        },
        {
          kind: "FIRST_DANCE",
          label: "First dance",
          offsetMinutes: 15,
          durationMinutes: 6,
        },
        {
          kind: "PARENT_DANCE",
          label: "Parent dances",
          offsetMinutes: 25,
          durationMinutes: 10,
        },
        {
          kind: "CAKE",
          label: "Cake cutting",
          offsetMinutes: 50,
          durationMinutes: 8,
        },
        {
          kind: "PARTY",
          label: "Baila / dance floor open",
          offsetMinutes: 70,
          durationMinutes: 120,
        },
        {
          kind: "LAST_DANCE",
          label: "Last dance",
          offsetMinutes: 200,
          durationMinutes: 6,
        },
      ];
    case "MEHNDI":
    case "ENGAGEMENT":
      return [
        {
          kind: "PARTY",
          label: "Upbeat welcome set",
          offsetMinutes: -15,
          durationMinutes: 30,
        },
        {
          kind: "CEREMONY",
          label: "Moment / ritual cue",
          offsetMinutes: 20,
          durationMinutes: 20,
        },
        {
          kind: "PARTY",
          label: "Dance floor / party",
          offsetMinutes: 45,
          durationMinutes: 120,
        },
      ];
    case "OTHER":
    default:
      return [
        {
          kind: "CUSTOM",
          label: "Opening cue",
          offsetMinutes: 0,
          durationMinutes: 10,
        },
        {
          kind: "PARTY",
          label: "Main set",
          offsetMinutes: 30,
          durationMinutes: 90,
        },
        {
          kind: "LAST_DANCE",
          label: "Close",
          offsetMinutes: 130,
          durationMinutes: 6,
        },
      ];
  }
}

export function musicPlanReady(input: {
  mustCount: number;
  cueCount: number;
}): boolean {
  return input.mustCount >= 1 || input.cueCount >= 3;
}

export function musicPlanSummaryFromPlan(
  plan: Pick<MusicPlan, "id" | "eventId" | "eventName" | "eventKind" | "shareEnabled"> & {
    tracks?: Array<Pick<MusicTrack, "list">>;
    cues?: Array<unknown>;
  },
): MusicPlanSummary {
  const tracks = plan.tracks ?? [];
  const mustCount = tracks.filter((t) => t.list === "MUST").length;
  const maybeCount = tracks.filter((t) => t.list === "MAYBE").length;
  const doNotCount = tracks.filter((t) => t.list === "DO_NOT").length;
  const cueCount = plan.cues?.length ?? 0;
  return {
    planId: plan.id,
    eventId: plan.eventId,
    eventName: plan.eventName ?? null,
    eventKind: plan.eventKind ?? null,
    mustCount,
    maybeCount,
    doNotCount,
    cueCount,
    shareEnabled: plan.shareEnabled,
    ready: musicPlanReady({ mustCount, cueCount }),
  };
}

export function musicTracksByList(tracks: MusicTrack[]): Record<MusicListKind, MusicTrack[]> {
  const groups: Record<MusicListKind, MusicTrack[]> = {
    MUST: [],
    MAYBE: [],
    DO_NOT: [],
  };
  for (const track of [...tracks].sort((a, b) => a.sortOrder - b.sortOrder)) {
    groups[track.list].push(track);
  }
  return groups;
}

type CueTimeInput = Pick<MusicCue, "startsAt" | "offsetMinutes" | "sortOrder">;
type EventTimeInput = { startsAt?: string | null; nekathAt?: string | null };

export function resolveCueStartsAt(
  cue: CueTimeInput,
  event: EventTimeInput,
): string | null {
  if (cue.startsAt) return cue.startsAt;
  if (cue.offsetMinutes == null) return null;
  const anchorIso = event.nekathAt ?? event.startsAt;
  if (!anchorIso) return null;
  return new Date(new Date(anchorIso).getTime() + cue.offsetMinutes * 60_000).toISOString();
}

export function orderedMusicCues<T extends CueTimeInput>(cues: T[], event: EventTimeInput): T[] {
  return [...cues].sort((a, b) => {
    const aStart = resolveCueStartsAt(a, event);
    const bStart = resolveCueStartsAt(b, event);
    if (aStart && bStart) {
      const diff = new Date(aStart).getTime() - new Date(bStart).getTime();
      if (diff !== 0) return diff;
    } else if (aStart) return -1;
    else if (bStart) return 1;
    if (a.offsetMinutes != null && b.offsetMinutes != null && a.offsetMinutes !== b.offsetMinutes) {
      return a.offsetMinutes - b.offsetMinutes;
    }
    return a.sortOrder - b.sortOrder;
  });
}

export function buildMusicBrief(input: {
  event: {
    name: string;
    kind: EventKind;
    startsAt?: string | null;
    nekathAt?: string | null;
    venueName?: string | null;
  };
  plan: Pick<MusicPlan, "notes" | "vibePrimary" | "languages">;
  tracks: MusicTrack[];
  cues: MusicCue[];
}): MusicBrief {
  const byList = musicTracksByList(input.tracks);
  const toBriefTrack = (track: MusicTrack) => ({
    list: track.list,
    title: track.title,
    artist: track.artist,
    url: track.url,
    language: track.language,
    vibe: track.vibe,
    notes: track.notes,
    sortOrder: track.sortOrder,
  });
  const cues = orderedMusicCues(input.cues, input.event).map((cue) => ({
    kind: cue.kind,
    label: cue.label,
    trackTitle: cue.trackTitle,
    startsAt: resolveCueStartsAt(cue, input.event),
    offsetMinutes: cue.offsetMinutes,
    durationMinutes: cue.durationMinutes,
    notes: cue.notes,
    sortOrder: cue.sortOrder,
  }));
  return {
    eventName: input.event.name,
    eventKind: input.event.kind,
    eventStartsAt: input.event.startsAt ?? null,
    venueName: input.event.venueName ?? null,
    notes: input.plan.notes,
    vibePrimary: input.plan.vibePrimary,
    languages: input.plan.languages,
    cues,
    mustPlay: byList.MUST.map(toBriefTrack),
    maybePlay: byList.MAYBE.map(toBriefTrack),
    doNotPlay: byList.DO_NOT.map(toBriefTrack),
  };
}
