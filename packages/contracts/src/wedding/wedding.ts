import { z } from "zod";
import { completenessResultSchema } from "../common";
import { payerSchema, weddingStyleSchema, weddingTypeSchema } from "./enums";
import { eventSchema } from "./events";
import { taskSchema } from "./tasks";
import { budgetLineSchema } from "./budget";
import { weddingAccessSchema, weddingMemberSchema } from "./access";
import { weddingVendorSchema } from "./team";
import { hubStatsSchema, plateSummarySchema, guestListSummarySchema } from "./presentation";

export const weddingSchema = z.object({
  id: z.string(),
  slug: z.string(),
  partnerOneName: z.string(),
  partnerTwoName: z.string(),
  date: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  guestCountEstimate: z.number().int(),
  budgetLkr: z.number().int(),
  payer: payerSchema,
  types: z.array(weddingTypeSchema),
  locale: z.string(),
  currency: z.string(),
  planningFromOverseas: z.boolean(),
  websiteEnabled: z.boolean(),
  websiteFaq: z.string().nullable(),
  travelNotes: z.string().nullable(),
  style: weddingStyleSchema,
  styleNotes: z.string().nullable(),
  settingNotes: z.string().nullable(),
  colors: z.array(z.string()),
  onboardingCompletedAt: z.string().nullable().optional(),
  events: z.array(eventSchema).optional(),
  tasks: z.array(taskSchema).optional(),
  budgetLines: z.array(budgetLineSchema).optional(),
  members: z.array(weddingMemberSchema).optional(),
});

export const updateWeddingBodySchema = z.object({
  partnerOneName: z.string().min(1).optional(),
  partnerTwoName: z.string().min(1).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  date: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  guestCountEstimate: z.number().int().min(1).optional(),
  budgetLkr: z.number().int().min(0).optional(),
  payer: payerSchema.optional(),
  types: z.array(weddingTypeSchema).optional(),
  planningFromOverseas: z.boolean().optional(),
  websiteEnabled: z.boolean().optional(),
  websiteFaq: z.string().nullable().optional(),
  travelNotes: z.string().nullable().optional(),
  seedMissingTasks: z.boolean().optional(),
  style: weddingStyleSchema.optional(),
  styleNotes: z.string().nullable().optional(),
  settingNotes: z.string().nullable().optional(),
  colors: z.array(z.string()).optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  completeOnboarding: z.boolean().optional(),
});

export const mineWeddingSchema = weddingSchema.extend({
  rsvpConfirmed: z.number().int(),
  rsvpTotal: z.number().int(),
  team: z.array(weddingVendorSchema),
  myAccess: weddingAccessSchema,
  completeness: completenessResultSchema.optional(),
  hubStats: hubStatsSchema.optional(),
  plateSummary: plateSummarySchema.optional(),
  guestSummary: guestListSummarySchema.optional(),
});

export type Wedding = z.infer<typeof weddingSchema>;
export type UpdateWeddingBody = z.infer<typeof updateWeddingBodySchema>;
export type MineWedding = z.infer<typeof mineWeddingSchema>;
