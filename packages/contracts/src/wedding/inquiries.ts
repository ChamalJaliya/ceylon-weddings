import { z } from "zod";
import { inquiryStatusSchema } from "./enums";

export const inquirySchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  vendorPhoto: z.string().nullable().optional(),
  coupleName: z.string().optional(),
  message: z.string(),
  status: inquiryStatusSchema,
  whatsappUrl: z.string().nullable(),
  preferredDate: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const createInquiryBodySchema = z.object({
  vendorId: z.string(),
  message: z.string().min(4),
  preferredDate: z.string().optional(),
  packageId: z.string().optional(),
  packageName: z.string().optional(),
});

export type Inquiry = z.infer<typeof inquirySchema>;
export type CreateInquiryBody = z.infer<typeof createInquiryBodySchema>;
