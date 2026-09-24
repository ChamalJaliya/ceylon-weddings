import { z } from "zod";
import { vendorCategorySchema } from "../vendor/enums";
import { eventSchema } from "./events";
import { mealSchema, rsvpStatusSchema } from "./enums";

export const publicWebsiteSchema = z.object({
  slug: z.string(),
  partnerOneName: z.string(),
  partnerTwoName: z.string(),
  date: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  colors: z.array(z.string()).optional(),
  websiteFaq: z.string().nullable(),
  travelNotes: z.string().nullable(),
  events: z.array(eventSchema),
  team: z
    .array(
      z.object({
        vendorId: z.string(),
        name: z.string(),
        slug: z.string(),
        category: vendorCategorySchema,
        photoUrl: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export const publicRsvpStatusSchema = z.enum(["CONFIRMED", "DECLINED", "MAYBE"]);

export const publicRsvpEventSchema = z.object({
  eventId: z.string().min(1),
  status: publicRsvpStatusSchema,
});

export const publicRsvpBodySchema = z.object({
  headName: z.string().min(1),
  plusCount: z.number().int().min(0).default(0),
  status: publicRsvpStatusSchema.optional(),
  meal: mealSchema.optional(),
  eventIds: z.array(z.string().min(1)).optional(),
  events: z.array(publicRsvpEventSchema).optional(),
});

export type PublicWebsite = z.infer<typeof publicWebsiteSchema>;
export type PublicRsvpBody = z.infer<typeof publicRsvpBodySchema>;
