function siteOf(hostname: string): string {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  if (parts.length < 2) return hostname.toLowerCase();
  return parts.slice(-2).join(".");
}

/** Same-origin `/api` proxy when the page and API are on different sites (e.g. vercel.app → railway.app). */
export function resolveBrowserApiBase(configured: string, pageOrigin: string): string {
  const trimmed = configured.replace(/\/$/, "") || "http://localhost:4000";
  try {
    const page = new URL(pageOrigin);
    const apiHost = new URL(trimmed, page.origin).hostname;
    if (siteOf(apiHost) !== siteOf(page.hostname)) {
      return `${page.origin}/api`;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export function apiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
  if (typeof window === "undefined") return configured;
  return resolveBrowserApiBase(configured, window.location.origin);
}
