"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_TABLE_PAGE_SIZE = 25;
export const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Client-side slice pagination for already-loaded arrays.
 * Prefer this when the API returns a full list; pass `page`/`limit`/`total`
 * from the server into `DataTableList` pagination when the API is paginated.
 */
export function useClientTablePagination<T>(
  items: T[],
  initialPageSize = DEFAULT_TABLE_PAGE_SIZE,
  resetKey?: string | number,
) {
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  useEffect(() => {
    setPage(1);
  }, [total, resetKey]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const setLimit = useCallback((nextLimit: number) => {
    setPage(1);
    setLimitState(nextLimit);
  }, []);

  const pageItems = useMemo(() => {
    const start = (page - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, page, limit]);

  return {
    page,
    setPage,
    setLimit,
    pageItems,
    total,
    totalPages,
    limit,
  };
}
