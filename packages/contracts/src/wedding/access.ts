import { z } from "zod";

export const weddingAccessSchema = z.object({
  role: z.enum(["COUPLE", "FAMILY"]),
  canEditGuests: z.boolean(),
  canViewBudget: z.boolean(),
  canManageVendors: z.boolean(),
});

export const weddingMemberSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["COUPLE", "FAMILY"]),
  canEditGuests: z.boolean(),
  canViewBudget: z.boolean(),
  canManageVendors: z.boolean(),
});

export const updateMemberFlagsBodySchema = z.object({
  canEditGuests: z.boolean().optional(),
  canViewBudget: z.boolean().optional(),
  canManageVendors: z.boolean().optional(),
});

export const inviteMemberBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  canEditGuests: z.boolean().default(true),
  canViewBudget: z.boolean().default(true),
  canManageVendors: z.boolean().default(false),
});

export type WeddingAccess = z.infer<typeof weddingAccessSchema>;
export type WeddingMember = z.infer<typeof weddingMemberSchema>;
export type UpdateMemberFlagsBody = z.infer<typeof updateMemberFlagsBodySchema>;
export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>;
