import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("ceylon-weddings-api"),
  timestamp: z.string(),
  redis: z.enum(["up", "down"]),
  postgres: z.enum(["up", "down"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
