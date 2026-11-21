"use client";

import { type FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { api, isApiError, useAuthStore, usePreferenceStore } from "@ceylonweddings/web";
import { AUTH_TOTP_INVALID, AUTH_TOTP_REQUIRED, type Currency, type Locale } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";
import { Link, useRouter } from "@/i18n/navigation";
import { homeForRole } from "@/components/auth-nav";
import { AuthBifold, AuthPasswordField, GoogleMark } from "@/components/auth-bifold";
import { requestGoogleAuthCode } from "@/lib/google-identity";

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
  /** Second step: the account has 2FA on. `via` remembers which sign-in asked for it. */
  const [twoFactor, setTwoFactor] = useState<{ via: "password" | "google" } | null>(null);
  const [totp, setTotp] = useState("");

  /** Returns true when the API asked for (or rejected) the authenticator code. */
  function handleTwoFactor(err: unknown, via: "password" | "google") {
    const reason = isApiError(err, 401) ? (err.body as { reason?: string } | undefined)?.reason : undefined;
    if (reason !== AUTH_TOTP_REQUIRED && reason !== AUTH_TOTP_INVALID) return false;
    setTwoFactor({ via });
    if (reason === AUTH_TOTP_INVALID) {
      setTotp("");
      setError(err instanceof Error ? err.message : "That code didn't match.");
    }
    return true;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (twoFactor?.via === "google") return onGoogle();
    setError(null);
    setPending(true);
    try {
      const result = await api.login({ email, password, ...(twoFactor ? { totp } : {}) });
      setUser(result.user);
      router.push(homeForRole(result.user.role));
    } catch (err) {
      if (!handleTwoFactor(err, "password")) setError(err instanceof Error ? err.message : "Login failed");
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
        const result = await api.google({ code, role: "COUPLE", locale, currency, ...(twoFactor ? { totp } : {}) });
        setUser(result.user);
        router.push(homeForRole(result.user.role));
      } finally {
        setPending(false);
      }
    } catch (err) {
      if (handleTwoFactor(err, "google")) return;
      const message = err instanceof Error ? err.message : t("auth.googleMissingSignIn");
      setError(message === "GOOGLE_MISSING" ? t("auth.googleMissingSignIn") : message);
    }
  }

  return (
    <AuthBifold>
      <h1 className="text-center font-serif text-3xl font-medium tracking-tight sm:text-4xl">
        {t("auth.loginHeading")}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.loginSub")}</p>

      {twoFactor ? (
        <form
          className="mt-8 grid gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
          onSubmit={onSubmit}
        >
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="modal__icon modal__icon--default">
              <ShieldCheck className="size-4" aria-hidden />
            </span>
            <div className="grid gap-1">
              <p className="font-medium text-foreground">Two-step verification</p>
              <p className="text-sm text-muted-foreground">
                {twoFactor.via === "google"
                  ? "Enter the 6-digit code from your authenticator app, then continue with Google."
                  : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>
          </div>
          <FieldBlock label="Authentication code" htmlFor="totp">
            <Input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              value={totp}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-body-lg tracking-ornate"
              autoFocus
              required
            />
          </FieldBlock>
          {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
          <Button type="submit" className="h-11 w-full" disabled={pending || totp.length !== 6}>
            {twoFactor.via === "google" ? (
              <>
                <GoogleMark />
                Verify and continue with Google
              </>
            ) : (
              "Verify and sign in"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTwoFactor(null);
              setTotp("");
              setError(null);
            }}
          >
            Use a different account
          </Button>
        </form>
      ) : (
        <form
          className="mt-8 grid gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
          onSubmit={onSubmit}
        >
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
          <Button type="button" variant="outline" className="h-11 w-full bg-card" disabled={pending} onClick={onGoogle}>
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
      )}
    </AuthBifold>
  );
}
