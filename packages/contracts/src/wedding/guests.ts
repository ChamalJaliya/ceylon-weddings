import { z } from "zod";
import {
  eventKindSchema,
  guestSideSchema,
  inviteChannelSchema,
  mealSchema,
  rsvpStatusSchema,
} from "./enums";

export const eventInviteSchema = z.object({
  eventId: z.string(),
  eventName: z.string().optional(),
  eventKind: eventKindSchema.optional(),
  status: rsvpStatusSchema,
});

export const guestHouseholdSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  label: z.string(),
  headName: z.string(),
  side: guestSideSchema,
  plusCount: z.number().int(),
  status: rsvpStatusSchema,
  meal: mealSchema.nullable(),
  channel: inviteChannelSchema,
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  giftReceived: z.boolean(),
  thanked: z.boolean(),
  invites: z.array(eventInviteSchema).optional(),
});

export const createGuestBodySchema = z.object({
  label: z.string().min(1),
  headName: z.string().min(1),
  side: guestSideSchema.default("BOTH"),
  plusCount: z.number().int().min(0).default(0),
  status: rsvpStatusSchema.default("CONSIDERING"),
  meal: mealSchema.optional(),
  channel: inviteChannelSchema.default("WHATSAPP"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  giftReceived: z.boolean().optional(),
  thanked: z.boolean().optional(),
  eventIds: z.array(z.string().min(1)).optional(),
});

export const updateGuestBodySchema = createGuestBodySchema.partial();

export const updateEventInviteBodySchema = z.object({
  status: rsvpStatusSchema,
});

export const guestListQuerySchema = z.object({
  side: guestSideSchema.optional(),
  status: rsvpStatusSchema.optional(),
  channel: inviteChannelSchema.optional(),
  meal: mealSchema.optional(),
  eventId: z.string().optional(),
  q: z.string().optional(),
});

export const guestImportRowSchema = z.object({
  label: z.string().min(1),
  headName: z.string().min(1),
  side: guestSideSchema.default("BOTH"),
  plusCount: z.number().int().min(0).default(0),
  status: rsvpStatusSchema.default("CONSIDERING"),
  meal: mealSchema.nullable().optional(),
  channel: inviteChannelSchema.default("WHATSAPP"),
  phone: z.string().nullable().optional(),
  email: z
    .string()
    .email()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  notes: z.string().nullable().optional(),
  eventNames: z.array(z.string()).optional(),
  eventKinds: z.array(eventKindSchema).optional(),
});

export const bulkCreateGuestsBodySchema = z.object({
  rows: z.array(guestImportRowSchema).min(1).max(500),
  defaultEventIds: z.array(z.string().min(1)).optional(),
});

export const guestImportResultSchema = z.object({
  created: z.number().int(),
  skipped: z.number().int(),
  errors: z.array(z.object({ row: z.number().int(), message: z.string() })),
});

export const GUEST_IMPORT_COLUMN_ALIASES: Record<string, keyof z.infer<typeof guestImportRowSchema> | "ignore"> = {
  label: "label",
  household: "label",
  family: "label",
  headname: "headName",
  name: "headName",
  head: "headName",
  side: "side",
  pluscount: "plusCount",
  plus: "plusCount",
  guests: "plusCount",
  status: "status",
  meal: "meal",
  channel: "channel",
  phone: "phone",
  mobile: "phone",
  whatsapp: "phone",
  email: "email",
  notes: "notes",
  events: "eventNames",
  eventnames: "eventNames",
};

export type EventInvite = z.infer<typeof eventInviteSchema>;
export type GuestHousehold = z.infer<typeof guestHouseholdSchema>;
export type CreateGuestBody = z.infer<typeof createGuestBodySchema>;
export type UpdateGuestBody = z.infer<typeof updateGuestBodySchema>;
export type UpdateEventInviteBody = z.infer<typeof updateEventInviteBodySchema>;
export type GuestListQuery = z.infer<typeof guestListQuerySchema>;
export type GuestImportRow = z.infer<typeof guestImportRowSchema>;
export type BulkCreateGuestsBody = z.infer<typeof bulkCreateGuestsBodySchema>;
export type GuestImportResult = z.infer<typeof guestImportResultSchema>;
