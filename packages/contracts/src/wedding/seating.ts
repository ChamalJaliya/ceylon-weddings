import { z } from "zod";

export const seatAssignmentSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  householdId: z.string(),
  seatsUsed: z.number().int(),
  householdLabel: z.string().optional(),
  headName: z.string().optional(),
});

export const seatingTableSchema = z.object({
  id: z.string(),
  planId: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  sortOrder: z.number().int(),
  notes: z.string().nullable().optional(),
  assignments: z.array(seatAssignmentSchema).optional(),
});

export const seatingPlanSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  eventId: z.string(),
  notes: z.string().nullable().optional(),
  tables: z.array(seatingTableSchema),
});

export const upsertSeatAssignmentBodySchema = z.object({
  householdId: z.string().min(1),
  seatsUsed: z.number().int().min(1).default(1),
});

export const upsertSeatingTableBodySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  capacity: z.number().int().min(1).default(10),
  sortOrder: z.number().int().default(0),
  notes: z.string().nullable().optional(),
  assignments: z.array(upsertSeatAssignmentBodySchema).default([]),
});

export const upsertSeatingPlanBodySchema = z.object({
  notes: z.string().nullable().optional(),
  tables: z.array(upsertSeatingTableBodySchema).default([]),
});

export const seatingTableSummarySchema = z.object({
  tableId: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  seated: z.number().int(),
  overbooked: z.boolean(),
});

export const seatingSummarySchema = z.object({
  seatedHeads: z.number().int(),
  capacity: z.number().int(),
  unassignedHouseholds: z.number().int(),
  unassignedHeads: z.number().int(),
  overbookedTables: z.number().int(),
  tables: z.array(seatingTableSummarySchema),
});

export const seatingResponseSchema = z.object({
  plan: seatingPlanSchema.nullable(),
  summary: seatingSummarySchema.nullable(),
});

export type SeatAssignment = z.infer<typeof seatAssignmentSchema>;
export type SeatingTable = z.infer<typeof seatingTableSchema>;
export type SeatingPlan = z.infer<typeof seatingPlanSchema>;
export type UpsertSeatingPlanBody = z.infer<typeof upsertSeatingPlanBodySchema>;
export type SeatingSummary = z.infer<typeof seatingSummarySchema>;
export type SeatingResponse = z.infer<typeof seatingResponseSchema>;
