import { z } from "zod";
import { appointmentKindSchema } from "./enums";

export const appointmentSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  eventId: z.string().nullable().optional(),
  vendorId: z.string().nullable(),
  vendorName: z.string().nullable().optional(),
  vendorWhatsapp: z.string().nullable().optional(),
  title: z.string(),
  kind: appointmentKindSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
  reminderMinutes: z.number().int(),
  notes: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number().int().optional(),
  ownerLabel: z.string().nullable().optional(),
});

export const createAppointmentBodySchema = z.object({
  title: z.string().min(1),
  kind: appointmentKindSchema.default("VENDOR_MEETING"),
  startsAt: z.string(),
  endsAt: z.string(),
  venueName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  reminderMinutes: z.number().int().min(0).default(30),
  notes: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  eventId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  ownerLabel: z.string().nullable().optional(),
});

export const updateAppointmentBodySchema = createAppointmentBodySchema.partial();

export const nekathAppointmentSpecSchema = z.object({
  title: z.string(),
  kind: appointmentKindSchema,
  offsetMinutes: z.number().int(),
  durationMinutes: z.number().int(),
  color: z.string().nullable(),
  ownerLabel: z.string().nullable().optional(),
});

export const agendaBlockSchema = appointmentSchema;

export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;
export type UpdateAppointmentBody = z.infer<typeof updateAppointmentBodySchema>;
export type NekathAppointmentSpec = z.infer<typeof nekathAppointmentSpecSchema>;
