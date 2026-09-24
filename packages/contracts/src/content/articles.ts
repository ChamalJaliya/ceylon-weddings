import { z } from "zod";
import { emptyToUndefined, optionalQueryString } from "../query";
import { articleStatusSchema } from "../admin/enums";

export const articleCategorySchema = z.enum([
  "FLOWERS",
  "CEREMONY",
  "CAKES",
  "TRANSPORT",
  "FASHION",
  "BEAUTY",
  "FAMILY",
  "EVENTS",
  "TRAVEL",
  "FOOD",
  "REAL_WEDDING",
]);

export const articleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  category: articleCategorySchema,
  coverUrl: z.string(),
  locale: z.string(),
  featured: z.boolean(),
  status: articleStatusSchema.optional(),
  vendorSlugs: z.array(z.string()).optional(),
  publishedAt: z.string().nullable(),
});

export const articleListQuerySchema = z.object({
  category: z.preprocess(emptyToUndefined, articleCategorySchema.optional()),
  q: optionalQueryString,
  vendorSlug: optionalQueryString,
});
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;
export type ArticleCategory = z.infer<typeof articleCategorySchema>;
export type Article = z.infer<typeof articleSchema>;
