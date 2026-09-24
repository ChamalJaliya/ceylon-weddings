"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@ceylonweddings/ui/components/input";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "../i18n/navigation";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    quoteKey: "auth.quote1" as const,
  },
  {
    src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80",
    quoteKey: "auth.quote2" as const,
  },
  {
    src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1600&q=80",
    quoteKey: "auth.quote3" as const,
  },
];

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0 5.29-1.93 6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthVisualPanel() {
  const t = useTranslations();
  const [slide, setSlide] = useState(0);

  return (
    <aside className="relative hidden h-full overflow-hidden lg:block">
      {SLIDES.map((item, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.src}
          src={item.src}
          alt={t("auth.panelAlt")}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700",
            index === slide ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20" />
      <div className="absolute inset-0 flex flex-col justify-end p-10 pb-14 text-hero-foreground">
        <p className="font-serif text-5xl leading-none">“</p>
        <p className="mt-2 max-w-md font-serif text-2xl leading-snug font-semibold">{t(SLIDES[slide].quoteKey)}</p>
        <div className="mt-8 flex gap-2">
          {SLIDES.map((item, index) => (
            <button
              key={item.src}
              type="button"
              aria-label={`${index + 1}`}
              onClick={() => setSlide(index)}
              className={cn(
                "h-1 rounded-full transition-all",
                index === slide ? "w-8 bg-hero-foreground" : "w-4 bg-hero-foreground/40 hover:bg-hero-foreground/70",
              )}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export function AuthPasswordField({
  id,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  maxLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword((open) => !open)}
        aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AuthBifold({
  children,
  size = "default",
}: {
  children: ReactNode;
  size?: "default" | "wide";
}) {
  const t = useTranslations();

  return (
    <div className="grid h-svh overflow-hidden lg:grid-cols-2">
      <section className="pearl relative flex h-full flex-col overflow-y-auto bg-background text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-28 size-72 rounded-full border border-primary/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full border border-primary/10"
        />
        {/* Sticky logo */}
        <div className="sticky top-0 z-10 flex justify-center bg-background/80 pb-3 pt-6 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full border border-primary/35 font-serif text-sm text-primary">
              CW
            </span>
            <span className="font-serif text-lg">{t("app.name")}</span>
          </Link>
        </div>
        {/* Scrollable content */}
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col justify-center px-6 pb-10 pt-4 sm:px-10",
            size === "wide" ? "max-w-2xl" : "max-w-md",
          )}
        >
          {children}
        </div>
      </section>
      <AuthVisualPanel />
    </div>
  );
}

