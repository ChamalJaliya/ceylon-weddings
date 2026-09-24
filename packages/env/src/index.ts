import { z } from "zod";

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
  GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  GOOGLE_CALLBACK_URL: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : "postmessage")),
  AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  AWS_REGION: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  S3_BUCKET: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  S3_PUBLIC_BASE_URL: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim().replace(/\/$/, "") : undefined)),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function loadApiEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  return apiEnvSchema.parse(source);
}

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_WS_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_APP: z.enum(["web", "couple", "vendor", "admin"]).default("web"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  NEXT_PUBLIC_S3_IMAGE_HOST: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
