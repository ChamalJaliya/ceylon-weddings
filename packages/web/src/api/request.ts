import { apiBase } from "./base-url";

/**
 * Hardened fetch core (ported from Kloqra web-shared/api/client.ts):
 *
 * - 401 → refresh the session once (single-flight across concurrent calls),
 *   then retry the original request once. The access cookie lives 15 min,
 *   the refresh cookie 30 days — without this, everyone is signed out every 15 min.
 * - Refresh failure → `SESSION_EXPIRED_EVENT` so stores drop the user.
 * - Identical in-flight GETs share one network request; one caller aborting
 *   never cancels the shared fetch for others.
 * - `cache: "no-store"` so a 304 can't serve stale data after login / reseed.
 * - Errors are `ApiError` (extends Error: existing `.message` callers keep working).
 */

export const SESSION_EXPIRED_EVENT = "cw:session-expired";

/** Credential forms: a 401 here is a form error, never an expired session. */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/google", "/auth/refresh", "/auth/logout"];

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status);
}

type RequestOptions = RequestInit & {
  /** Internal: this call is already the post-refresh retry. */
  _retry?: boolean;
};

const inflightGets = new Map<string, Promise<unknown>>();
let refreshInFlight: Promise<boolean> | null = null;

function canRefresh(path: string) {
  return typeof window !== "undefined" && !NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}

/** One refresh for every request that hit 401 at the same time. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${apiBase()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .then((ok) => {
        refreshInFlight = null;
        if (!ok && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        }
        return ok;
      });
  }
  return refreshInFlight;
}

async function parseError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({ message: response.statusText }))) as {
    message?: string | string[];
  };
  const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
  return new ApiError(message ?? "Request failed", response.status, body);
}

async function execute<T>(path: string, options: RequestOptions): Promise<T> {
  const { _retry, signal, ...init } = options;
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    signal,
    cache: init.cache ?? "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !_retry && canRefresh(path) && (await refreshSession())) {
      return execute<T>(path, { ...options, _retry: true });
    }
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Reject this caller when its signal aborts, without cancelling shared work. */
function withCallerAbort<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" || options.body != null) {
    return execute<T>(path, options);
  }

  const existing = inflightGets.get(path);
  if (existing) return withCallerAbort(existing as Promise<T>, options.signal);

  // Shared GETs must not carry one caller's AbortSignal into fetch.
  const shared = execute<T>(path, { ...options, signal: undefined });
  inflightGets.set(path, shared);
  // Not .finally(): that re-rejects into an unawaited promise (unhandled rejection).
  const clear = () => {
    if (inflightGets.get(path) === shared) inflightGets.delete(path);
  };
  shared.then(clear, clear);
  return withCallerAbort(shared, options.signal);
}

/** Test / logout helper. */
export function clearInflightRequests() {
  inflightGets.clear();
}
