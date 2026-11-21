"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { api, COOKIES, formatMoney, useAuthStore, usePreferenceStore } from "@ceylonweddings/web";
import type { Currency, Locale } from "@ceylonweddings/contracts";
import { RadioGroup } from "@ceylonweddings/ui/components/radio";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SettingsCard, SettingsRow } from "../components/settings-card";

const LANGUAGES: Array<{ value: Locale; label: string; description: string }> = [
  { value: "en", label: "English", description: "English" },
  { value: "si", label: "සිංහල", description: "Sinhala" },
  { value: "ta", label: "தமிழ்", description: "Tamil" },
];

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: "LKR", label: "LKR — Sri Lankan rupee" },
  { value: "USD", label: "USD — US dollar" },
  { value: "AUD", label: "AUD — Australian dollar" },
  { value: "GBP", label: "GBP — British pound" },
  { value: "EUR", label: "EUR — Euro" },
];

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/** Saves to the account (follows you to other devices) and to this browser. */
export default function LanguageSection() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const currency = usePreferenceStore((state) => state.currency) as Currency;
  const setCurrency = usePreferenceStore((state) => state.setCurrency);
  const [busy, setBusy] = useState(false);

  async function persist(patch: { locale?: Locale; currency?: Currency }) {
    if (!user) return;
    setBusy(true);
    try {
      setUser(await api.account.updateProfile(patch));
      toast.success("Preference saved");
    } catch {
      toast.error("Saved on this device only — we couldn't reach your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SettingsCard title="Language" description="Menus, emails, and guest pages you share use this language.">
        <RadioGroup
          name="locale"
          value={locale}
          disabled={busy}
          options={LANGUAGES.map((l) => ({ value: l.value, label: l.label, description: l.description }))}
          onValueChange={async (next) => {
            setCookie(COOKIES.locale, next);
            await persist({ locale: next as Locale });
            router.replace(pathname, { locale: next as Locale });
          }}
        />
      </SettingsCard>

      <SettingsCard title="Currency" description="Vendor prices and your budget are shown in this currency.">
        <SettingsRow label="Show prices in" hint={`Example: ${formatMoney(2500000, currency)}`}>
          <SimpleSelect
            aria-label="Currency"
            value={currency}
            disabled={busy}
            options={CURRENCIES}
            onValueChange={async (next) => {
              setCurrency(next as Currency);
              setCookie(COOKIES.currency, next);
              await persist({ currency: next as Currency });
            }}
          />
        </SettingsRow>
      </SettingsCard>
    </>
  );
}
