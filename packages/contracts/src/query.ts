import { z } from "zod";

export const ATTR_QUERY_PREFIX = "a.";

export function emptyToUndefined(value: unknown) {
  if (value === "" || value === null) return undefined;
  return value;
}

export const optionalQueryString = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(120).optional(),
);

export const queryBoolean = z.preprocess((value) => {
  if (value === undefined || value === "" || value === null) return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

export function queryInt(defaultValue: number, min: number, max: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    return value;
  }, z.coerce.number().int().min(min).max(max));
}

export function optionalQueryNumber(min: number, max: number, integer = false) {
  const numberSchema = integer ? z.coerce.number().int().min(min).max(max) : z.coerce.number().min(min).max(max);
  return z.preprocess(emptyToUndefined, numberSchema.optional());
}

export const paginatedQuerySchema = z.object({
  page: queryInt(1, 1, 10_000),
  pageSize: queryInt(20, 1, 100),
  q: optionalQueryString,
});

export type PaginatedQuery = z.infer<typeof paginatedQuerySchema>;

export const paginatedMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  pageCount: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PaginatedMeta = z.infer<typeof paginatedMetaSchema>;

export function paginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return paginatedMetaSchema.extend({
    items: z.array(itemSchema),
  });
}

export type PaginatedResult<T> = PaginatedMeta & {
  items: T[];
};

export const facetBucketSchema = z.object({
  value: z.string(),
  count: z.number().int().min(0),
});

export type FacetBucket = z.infer<typeof facetBucketSchema>;

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = pageCount === 0 ? 1 : Math.min(Math.max(page, 1), pageCount);
  return {
    items,
    page: safePage,
    pageSize,
    total,
    pageCount,
    hasNext: safePage < pageCount,
    hasPrev: safePage > 1,
  };
}

export function paginationWindow(page: number, pageCount: number, radius = 2): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  if (pageCount === 1) return [1];
  const pages = new Set<number>([1, pageCount]);
  for (let index = page - radius; index <= page + radius; index += 1) {
    if (index >= 1 && index <= pageCount) pages.add(index);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    if (index > 0 && current - sorted[index - 1]! > 1) items.push("ellipsis");
    items.push(current);
  }
  return items;
}

export type CatalogAttrFilterValue = string | string[] | { min?: number; max?: number };

function appendAttrFilters(
  params: URLSearchParams,
  attrs: Record<string, unknown>,
) {
  for (const [attrKey, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === "") continue;
    const paramKey = `${ATTR_QUERY_PREFIX}${attrKey}`;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        params.append(paramKey, String(item));
      }
      continue;
    }
    if (typeof value === "object") {
      const range = value as { min?: number; max?: number };
      if (range.min !== undefined && range.min !== null) {
        params.set(`${paramKey}.min`, String(range.min));
      }
      if (range.max !== undefined && range.max !== null) {
        params.set(`${paramKey}.max`, String(range.max));
      }
      continue;
    }
    params.set(paramKey, String(value));
  }
}

export function toSearchParams(
  query: Record<string, unknown>,
  defaults: Record<string, unknown> = {},
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Object.is(defaults[key], value)) continue;

    if (key === "attrs" && typeof value === "object" && !Array.isArray(value)) {
      appendAttrFilters(params, value as Record<string, unknown>);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }
  return params;
}

/** Collect all entries; duplicate keys become string[]. */
export function collectSearchParams(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const collected: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    const existing = collected[key];
    if (existing === undefined) {
      collected[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      collected[key] = [existing, value];
    }
  }
  return collected;
}

export function parseSearchParams<T>(schema: z.ZodType<T>, searchParams: URLSearchParams): T {
  const parsed = schema.safeParse(collectSearchParams(searchParams));
  if (parsed.success) return parsed.data;
  return schema.parse({});
}
