import { z } from "zod";
import { eventKindSchema } from "./enums";

export const eventSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  kind: eventKindSchema,
  name: z.string(),
  startsAt: z.string().nullable(),
  nekathAt: z.string().nullable(),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
});

export const createEventBodySchema = z.object({
  kind: eventKindSchema,
  name: z.string().min(1),
  startsAt: z.string().nullable().optional(),
  nekathAt: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export const updateEventBodySchema = createEventBodySchema.partial();

export type Event = z.infer<typeof eventSchema>;
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
