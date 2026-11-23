import { useCallback, useEffect, useState } from "react";

/** Minimal fetch hook with pull-to-refresh support. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        setData(await run());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [run],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, error, loading, refreshing, refresh: () => load(true), reload: () => load() };
}
