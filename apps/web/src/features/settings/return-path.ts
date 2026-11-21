"use client";

import { useEffect } from "react";

/**
 * Settings is its own context: its header offers "← Back" to wherever the user
 * was before (Kloqra pattern). AppChrome records every non-settings page here.
 */
const KEY = "cw:settings-return-to";

export function rememberReturnPath(path: string) {
  if (path.startsWith("/settings")) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* private mode / storage blocked */
  }
}

export function readReturnPath(): string | null {
  try {
    const stored = sessionStorage.getItem(KEY);
    // Same-origin paths only — never an open redirect.
    return stored && stored.startsWith("/") && !stored.startsWith("//") ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Reads the query string from `location` inside the effect rather than
 * useSearchParams(), which would force every static page in AppChrome into
 * client-side rendering.
 */
export function useRememberReturnPath(pathname: string) {
  useEffect(() => {
    const search = window.location.search;
    rememberReturnPath(search ? `${pathname}${search}` : pathname);
  }, [pathname]);
}
