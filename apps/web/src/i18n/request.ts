import { getRequestConfig } from "next-intl/server";
import { isLocale, messages, type Locale } from "@ceylonweddings/i18n";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
