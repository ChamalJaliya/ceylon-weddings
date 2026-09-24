import { z } from "zod";
import { vendorCategorySchema, priceDisplayModeSchema } from "../vendor/enums";
import { vendorLinkStatusSchema } from "./enums";

export const weddingVendorSchema = z.object({
  vendorId: z.string(),
  name: z.string(),
  slug: z.string(),
  category: vendorCategorySchema,
  status: vendorLinkStatusSchema,
  photoUrl: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  startingPriceLkr: z.number().int().nullable().optional(),
  priceDisplayMode: priceDisplayModeSchema.optional(),
  showPricing: z.boolean().optional(),
  whatsapp: z.string().nullable().optional(),
});

export const shortlistVendorBodySchema = z.object({
  vendorId: z.string().min(1),
});

export const updateTeamVendorBodySchema = z.object({
  status: vendorLinkStatusSchema,
});

export const teamBoardItemSchema = weddingVendorSchema;

export type WeddingVendor = z.infer<typeof weddingVendorSchema>;
export type ShortlistVendorBody = z.infer<typeof shortlistVendorBodySchema>;
export type UpdateTeamVendorBody = z.infer<typeof updateTeamVendorBodySchema>;
export type TeamBoardItem = z.infer<typeof teamBoardItemSchema>;
