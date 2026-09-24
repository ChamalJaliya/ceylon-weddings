import { z } from "zod";
import { mealSchema, payerSchema, rsvpStatusSchema, guestSideSchema } from "./enums";

export const plateMealBucketSchema = z.object({
  meal: mealSchema.nullable(),
  heads: z.number().int(),
});

export const plateSummarySchema = z.object({
  estimate: z.number().int(),
  confirmedHeads: z.number().int(),
  consideringHeads: z.number().int(),
  declinedHeads: z.number().int(),
  invitedHeads: z.number().int(),
  bufferGap: z.number().int(),
  byMeal: z.array(plateMealBucketSchema),
  eventId: z.string().nullable().optional(),
});

export const payerPotSchema = z.object({
  payer: payerSchema,
  plannedLkr: z.number().int(),
  spentLkr: z.number().int(),
  paidLkr: z.number().int(),
  unpaidLkr: z.number().int(),
});

export const guestStatusBucketSchema = z.object({
  status: rsvpStatusSchema,
  households: z.number().int(),
  heads: z.number().int(),
});

export const guestSideBucketSchema = z.object({
  side: guestSideSchema,
  households: z.number().int(),
  heads: z.number().int(),
});

export const guestListSummarySchema = z.object({
  households: z.number().int(),
  heads: z.number().int(),
  byStatus: z.array(guestStatusBucketSchema),
  bySide: z.array(guestSideBucketSchema),
  byMeal: z.array(plateMealBucketSchema),
});

export const hubStatsSchema = z.object({
  daysToNextEvent: z.number().int().nullable(),
  nextEventId: z.string().nullable(),
  nextEventName: z.string().nullable(),
  nextEventAt: z.string().nullable(),
  tasksOpen: z.number().int(),
  tasksDone: z.number().int(),
  rsvpConfirmed: z.number().int(),
  rsvpTotal: z.number().int(),
  teamBooked: z.number().int(),
  teamTotal: z.number().int(),
  budgetSpentLkr: z.number().int(),
  budgetCapLkr: z.number().int(),
  unpaidLkr: z.number().int(),
  plateConfirmedHeads: z.number().int(),
  plateEstimate: z.number().int(),
  missingCategories: z.array(z.string()),
  musicReadyPlans: z.number().int().optional(),
  musicPlanCount: z.number().int().optional(),
  moodboardReadyCount: z.number().int().optional(),
  moodboardCount: z.number().int().optional(),
});

export type PlateSummary = z.infer<typeof plateSummarySchema>;
export type PayerPot = z.infer<typeof payerPotSchema>;
export type GuestListSummary = z.infer<typeof guestListSummarySchema>;
export type HubStats = z.infer<typeof hubStatsSchema>;
