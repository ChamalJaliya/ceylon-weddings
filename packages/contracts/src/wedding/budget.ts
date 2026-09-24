import { z } from "zod";
import { payerSchema } from "./enums";

export const budgetLineSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  category: z.string(),
  label: z.string(),
  plannedLkr: z.number().int(),
  spentLkr: z.number().int(),
  paidLkr: z.number().int(),
  payer: payerSchema,
  vendorId: z.string().nullable(),
  depositDueAt: z.string().nullable().optional(),
  balanceDueAt: z.string().nullable().optional(),
});

export const createBudgetLineBodySchema = z.object({
  category: z.string().min(1),
  label: z.string().min(1),
  plannedLkr: z.number().int().min(0),
  spentLkr: z.number().int().min(0).default(0),
  paidLkr: z.number().int().min(0).default(0),
  payer: payerSchema.default("COUPLE"),
  vendorId: z.string().nullable().optional(),
  depositDueAt: z.string().nullable().optional(),
  balanceDueAt: z.string().nullable().optional(),
});

export const updateBudgetLineBodySchema = z.object({
  category: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  plannedLkr: z.number().int().min(0).optional(),
  spentLkr: z.number().int().min(0).optional(),
  paidLkr: z.number().int().min(0).optional(),
  payer: payerSchema.optional(),
  vendorId: z.string().nullable().optional(),
  depositDueAt: z.string().nullable().optional(),
  balanceDueAt: z.string().nullable().optional(),
});

export type BudgetLine = z.infer<typeof budgetLineSchema>;
export type CreateBudgetLineBody = z.infer<typeof createBudgetLineBodySchema>;
export type UpdateBudgetLineBody = z.infer<typeof updateBudgetLineBodySchema>;
