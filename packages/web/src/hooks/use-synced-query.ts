"use client";

import { useCallback, useMemo } from "react";
import { collectSearchParams, toSearchParams } from "@ceylonweddings/contracts";

type QuerySchema<T> = {
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => { success: true; data: T } | { success: false };
};

export type SyncedQueryNav = (href: string, options?: { scroll?: boolean }) => void;

export type SetQueryOptions = {
  history?: "replace" | "push";
  scroll?: boolean;
};

export function useSyncedQuery<T extends object>(options: {
  schema: QuerySchema<T>;
  defaults: Record<string, unknown>;
  pathname: string;
  searchParams: URLSearchParams;
  replace: SyncedQueryNav;
  push?: SyncedQueryNav;
}) {
  const { schema, defaults, pathname, searchParams, replace, push } = options;
  const search = searchParams.toString();

  const query = useMemo(() => {
    const collected = collectSearchParams(new URLSearchParams(search));
    const parsed = schema.safeParse(collected);
    return parsed.success ? parsed.data : schema.parse({});
  }, [schema, search]);

  const hrefFor = useCallback(
    (next: Record<string, unknown>) => {
      const qs = toSearchParams(next, defaults).toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [defaults, pathname],
  );

  const setQuery = useCallback(
    (patch: Partial<T>, nav?: SetQueryOptions) => {
      const merged: Record<string, unknown> = { ...query, ...patch };
      const resetsPage = Object.keys(patch).some((key) => key !== "page");
      if (resetsPage && !("page" in patch)) merged.page = 1;
      const href = hrefFor(merged);
      const current = search ? `${pathname}?${search}` : pathname;
      if (href === current) return;
      const method = nav?.history === "push" ? (push ?? replace) : replace;
      method(href, { scroll: nav?.scroll ?? false });
    },
    [hrefFor, pathname, push, query, replace, search],
  );

  return { query, setQuery, href: hrefFor(query as Record<string, unknown>) };
}
