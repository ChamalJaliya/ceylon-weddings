import { z } from "zod";
import { currencySchema, localeSchema, roleSchema } from "./common";
import { userPreferencesSchema } from "./notifications/preferences";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  name: z.string(),
  role: roleSchema,
  locale: localeSchema,
  currency: currencySchema,
  createdAt: z.string(),
  preferences: userPreferencesSchema.default({}),
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

/** 6-digit authenticator code. Required at sign-in once 2FA is on. */
export const totpCodeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  totp: totpCodeSchema.optional(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const googleAuthBodySchema = z.object({
  idToken: z.string().min(10).optional(),
  code: z.string().min(1).optional(),
  role: z.enum(["COUPLE", "VENDOR"]).default("COUPLE"),
  locale: localeSchema.default("en"),
  currency: currencySchema.default("LKR"),
  totp: totpCodeSchema.optional(),
});

export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;

export const authResponseSchema = z.object({
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

/** 401 `reason` values the sign-in form reacts to. */
export const AUTH_TOTP_REQUIRED = "totp_required";
export const AUTH_TOTP_INVALID = "totp_invalid";

// ── Account settings ──────────────────────────────────────────────────────

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(9).max(20).nullable(),
    locale: localeSchema,
    currency: currencySchema,
  })
  .partial();

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8, "Use at least 8 characters").max(72),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Choose a password you have not used here",
    path: ["newPassword"],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;

export const accountSessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  current: z.boolean(),
});

export type AccountSession = z.infer<typeof accountSessionSchema>;

export const accountSecuritySchema = z.object({
  twoFactorEnabled: z.boolean(),
  /** false for accounts created with Google that never set a password */
  hasPassword: z.boolean(),
  sessions: z.array(accountSessionSchema),
});

export type AccountSecurity = z.infer<typeof accountSecuritySchema>;

export const twoFactorSetupSchema = z.object({
  secret: z.string(),
  otpauthUri: z.string(),
});

export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;

export const twoFactorCodeBodySchema = z.object({ token: totpCodeSchema });
export type TwoFactorCodeBody = z.infer<typeof twoFactorCodeBodySchema>;
