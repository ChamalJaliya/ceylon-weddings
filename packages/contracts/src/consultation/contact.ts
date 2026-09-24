import { z } from "zod";
import { emptyToUndefined, optionalQueryString } from "../query";

export const contactMessageStatusSchema = z.enum(["NEW", "READ", "CLOSED"]);
export type ContactMessageStatus = z.infer<typeof contactMessageStatusSchema>;

export const contactMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string(),
  status: contactMessageStatusSchema,
  createdAt: z.string(),
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const createContactMessageBodySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.preprocess(emptyToUndefined, z.string().trim().min(6).max(40).optional()),
  message: z.string().trim().min(4, "Write a short message").max(4000),
});
export type CreateContactMessageBody = z.infer<typeof createContactMessageBodySchema>;

export const contactMessageListQuerySchema = z.object({
  q: optionalQueryString,
  status: z.preprocess(emptyToUndefined, contactMessageStatusSchema.optional()),
});
export type ContactMessageListQuery = z.infer<typeof contactMessageListQuerySchema>;

export const updateContactMessageBodySchema = z.object({
  status: contactMessageStatusSchema,
});
export type UpdateContactMessageBody = z.infer<typeof updateContactMessageBodySchema>;
