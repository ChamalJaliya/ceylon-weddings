const HREF_KEY = "cw.catalog.href";
const SCROLL_KEY = "cw.catalog.scroll";
const RETURN_KEY = "cw.catalog.returning";

function canUseSession() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/** Locale-free catalog path, e.g. `/vendors?q=colombo&page=2`. */
export function persistCatalogHref(href: string) {
  if (!canUseSession()) return;
  sessionStorage.setItem(HREF_KEY, href);
}

export function readCatalogHref(): string {
  if (!canUseSession()) return "/vendors";
  return sessionStorage.getItem(HREF_KEY) || "/vendors";
}

export function markLeavingCatalog() {
  if (!canUseSession()) return;
  sessionStorage.setItem(RETURN_KEY, "1");
  sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
}

export function consumeCatalogReturning(): boolean {
  if (!canUseSession()) return false;
  const value = sessionStorage.getItem(RETURN_KEY);
  if (value) sessionStorage.removeItem(RETURN_KEY);
  return value === "1";
}

export function readCatalogScroll(): number {
  if (!canUseSession()) return 0;
  const raw = sessionStorage.getItem(SCROLL_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function clearCatalogScroll() {
  if (!canUseSession()) return;
  sessionStorage.removeItem(SCROLL_KEY);
}
