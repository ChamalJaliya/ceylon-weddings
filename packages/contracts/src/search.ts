import { z } from "zod";

export const searchHitKindSchema = z.enum([
  "vendor",
  "guest",
  "task",
  "lead",
  "user",
  "wedding",
  "article",
]);

export const searchHitSchema = z.object({
  id: z.string(),
  kind: searchHitKindSchema,
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  href: z.string(),
  badge: z.string().nullable().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const searchResponseSchema = z.object({
  q: z.string(),
  items: z.array(searchHitSchema),
});

export type SearchHitKind = z.infer<typeof searchHitKindSchema>;
export type SearchHit = z.infer<typeof searchHitSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
