import { localeSchema, type Locale } from "@ceylonweddings/contracts";
import en from "./messages/en.json";
import si from "./messages/si.json";
import ta from "./messages/ta.json";

export type { Locale };
export const locales = localeSchema.options;
export const defaultLocale: Locale = "en";

export const messages = { en, si, ta } as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
