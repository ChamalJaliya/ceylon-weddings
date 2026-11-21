import { readEnvValue } from "./mailer.service";

/** Public web origin for links in emails: PUBLIC_APP_URL, else the first CORS origin. */
export function appOrigin(): string {
  const explicit = readEnvValue("PUBLIC_APP_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const cors = readEnvValue("CORS_ORIGINS")?.split(",")[0]?.trim();
  return (cors || "http://localhost:3000").replace(/\/$/, "");
}

/** Absolute URL for an app-relative href (English locale prefix by default). */
export function appUrl(href: string, locale = "en"): string {
  if (/^https?:\/\//i.test(href)) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${appOrigin()}/${locale}${path}`;
}
