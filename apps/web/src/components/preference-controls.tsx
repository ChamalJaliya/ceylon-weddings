"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Settings2 } from "lucide-react";
import { COOKIES, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import type { Currency, Locale, ThemeName } from "@ceylonweddings/contracts";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Label } from "@ceylonweddings/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@ceylonweddings/ui/components/popover";
import { cn } from "@ceylonweddings/ui/utils";
import { usePathname, useRouter } from "../i18n/navigation";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function PreferenceControls({
  overlay = false,
  showSample = false,
}: {
  overlay?: boolean;
  showSample?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const currency = usePreferenceStore((state) => state.currency);
  const setCurrency = usePreferenceStore((state) => state.setCurrency);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          shape="pill"
          aria-label={t("prefs.open")}
          className={cn(overlay && "text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground")}
        >
          <Icon icon={Settings2} size="sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("prefs.language")}</Label>
            <SimpleSelect
              value={locale}
              onValueChange={(next) => {
                setCookie(COOKIES.locale, next);
                router.replace(pathname, { locale: next as Locale });
              }}
              options={[
                { value: "en", label: "English" },
                { value: "si", label: "සිංහල" },
                { value: "ta", label: "தமிழ்" },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("prefs.currency")}</Label>
            <SimpleSelect
              value={currency}
              onValueChange={(next) => {
                setCurrency(next as Currency);
                setCookie(COOKIES.currency, next);
              }}
              options={[
                { value: "LKR", label: "LKR" },
                { value: "USD", label: "USD" },
                { value: "AUD", label: "AUD" },
                { value: "GBP", label: "GBP" },
                { value: "EUR", label: "EUR" },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("prefs.theme")}</Label>
            <SimpleSelect
              value={theme ?? "pearl"}
              onValueChange={(next) => {
                setTheme(next);
                setCookie(COOKIES.theme, next);
              }}
              options={[
                { value: "pearl", label: t("themes.pearl") },
                { value: "temple", label: t("themes.temple") },
                { value: "night", label: t("themes.night") },
              ]}
            />
          </div>
          {showSample ? <p className="text-xs text-muted-foreground">{formatMoney(2500000, currency)}</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
