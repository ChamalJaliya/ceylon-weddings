"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncPageState<TResult> = {
  data: TResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function useAsyncPage<TQuery, TResult>(
  query: TQuery,
  fetcher: (query: TQuery, signal: AbortSignal) => Promise<TResult>,
  options?: { debounceMs?: number; enabled?: boolean },
): AsyncPageState<TResult> {
  const debounceMs = options?.debounceMs ?? 0;
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const serialized = JSON.stringify(query);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let cancelled = false;
    const parsed = JSON.parse(serialized) as TQuery;

    const run = () => {
      setLoading(true);
      setError(null);
      fetcherRef
        .current(parsed, controller.signal)
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch((err: unknown) => {
          if (cancelled || controller.signal.aborted || isAbortError(err)) return;
          setError(err instanceof Error ? err.message : "Request failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    const timer = debounceMs > 0 ? window.setTimeout(run, debounceMs) : undefined;
    if (timer === undefined) run();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [serialized, debounceMs, enabled, tick]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);

  return { data, loading, error, refetch };
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
