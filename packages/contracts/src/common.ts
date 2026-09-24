import { z } from "zod";

export const localeSchema = z.enum(["en", "si", "ta"]);
export type Locale = z.infer<typeof localeSchema>;

export const currencySchema = z.enum(["LKR", "USD", "AUD", "GBP", "EUR"]);
export type Currency = z.infer<typeof currencySchema>;

export const themeSchema = z.enum(["pearl", "temple", "night"]);
export type ThemeName = z.infer<typeof themeSchema>;

export const roleSchema = z.enum(["COUPLE", "VENDOR", "ADMIN", "FAMILY"]);
export type Role = z.infer<typeof roleSchema>;

export const idSchema = z.string().min(1);

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
});

export const okResultSchema = z.object({
  ok: z.literal(true),
});
export type OkResult = z.infer<typeof okResultSchema>;

export const completenessResultSchema = z.object({
  score: z.number().int(),
  total: z.number().int(),
  ready: z.boolean(),
  missing: z.array(z.string()),
});
export type CompletenessResult = z.infer<typeof completenessResultSchema>;

export const COOKIES = {
  access: "cw_access",
  refresh: "cw_refresh",
  locale: "cw_locale",
  currency: "cw_currency",
  theme: "cw_theme",
} as const;
