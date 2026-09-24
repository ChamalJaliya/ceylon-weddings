import { z } from "zod";
import { currencySchema, localeSchema, roleSchema } from "./common";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  name: z.string(),
  role: roleSchema,
  locale: localeSchema,
  currency: currencySchema,
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
  businessName: z.string().min(2).max(80).optional(),
  phone: z.string().min(9).max(20).optional(),
  role: z.enum(["COUPLE", "VENDOR"]).default("COUPLE"),
  locale: localeSchema.default("en"),
  currency: currencySchema.default("LKR"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const googleAuthBodySchema = z.object({
  idToken: z.string().min(10).optional(),
  code: z.string().min(1).optional(),
  role: z.enum(["COUPLE", "VENDOR"]).default("COUPLE"),
  locale: localeSchema.default("en"),
  currency: currencySchema.default("LKR"),
});

export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;

export const authResponseSchema = z.object({
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
