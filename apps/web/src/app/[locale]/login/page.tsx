"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api, useAuthStore, usePreferenceStore } from "@ceylonweddings/web";
import type { Currency, Locale } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";
import { Link, useRouter } from "../../../i18n/navigation";
import { homeForRole } from "../../../components/auth-nav";
import { AuthBifold, AuthPasswordField, GoogleMark } from "../../../components/auth-bifold";
import { requestGoogleAuthCode } from "../../../lib/google-identity";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const currency = usePreferenceStore((state) => state.currency) as Currency;
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("couple@ceylonweddings.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await api.login({ email, password });
      setUser(result.user);
      router.push(homeForRole(result.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      const code = await requestGoogleAuthCode();
      setPending(true);
      try {
        const result = await api.google({ code, role: "COUPLE", locale, currency });
        setUser(result.user);
        router.push(homeForRole(result.user.role));
      } finally {
        setPending(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.googleMissingSignIn");
      setError(message === "GOOGLE_MISSING" ? t("auth.googleMissingSignIn") : message);
    }
  }

  return (
    <AuthBifold>
      <h1 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("auth.loginHeading")}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.loginSub")}</p>

      <form className="mt-8 grid gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500" onSubmit={onSubmit}>
        <FieldBlock label={t("auth.email")} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FieldBlock>
        <FieldBlock label={t("auth.password")} htmlFor="password">
          <AuthPasswordField
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            maxLength={72}
          />
        </FieldBlock>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {t("nav.signIn")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full bg-card"
          disabled={pending}
          onClick={onGoogle}
        >
          <GoogleMark />
          {t("auth.googleSignIn")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </AuthBifold>
  );
}
