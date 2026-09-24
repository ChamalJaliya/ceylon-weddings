import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "@ceylonweddings/i18n";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeCookie: {
    name: "cw_locale",
  },
});
