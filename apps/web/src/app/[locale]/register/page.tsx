"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Sparkles, Store, ShieldCheck } from "lucide-react";
import { api, useAuthStore, usePreferenceStore } from "@ceylonweddings/web";
import { slugifyVendorName, type Currency, type Locale } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon, type IconComponent } from "@ceylonweddings/ui/components/icon";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";
import { AnimatePresence, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link, useRouter } from "../../../i18n/navigation";
import { PageFrame } from "../../../components/public-chrome";
import { AuthPasswordField, GoogleMark } from "../../../components/auth-bifold";
import { requestGoogleAuthCode } from "../../../lib/google-identity";
import { passwordStrength } from "../../../lib/password-strength";
import { CoupleWizardInline, STYLE_COLORS, type CoupleWizardData } from "./_components/couple-wizard-inline";
import { VendorWizardInline, type VendorWizardData } from "./_components/vendor-wizard-inline";

function roleFromParam(raw: string | null): "COUPLE" | "VENDOR" {
  if (!raw) return "COUPLE";
  const normalized = raw.trim().toUpperCase();
  if (normalized === "VENDOR") return "VENDOR";
  return "COUPLE";
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

const ROLE_OPTIONS: Array<{
  role: "COUPLE" | "VENDOR";
  badge: string;
  headline: string;
  tagline: string;
  image: string;
  icon: IconComponent;
  accentClass: string;
  glowClass: string;
  badgeClass: string;
  features: readonly string[];
}> = [
  {
    role: "COUPLE",
    badge: "For Couples",
    headline: "We're getting married",
    tagline: "Plan your Sri Lankan wedding with all-in-one tools, budgets, checklists & invites.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80",
    icon: Heart,
    accentClass: "border-rose-500/30 hover:border-rose-500/70",
    glowClass: "from-rose-500/15 via-amber-500/10 to-transparent",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25",
    features: [
      "Custom wedding website & digital RSVPs",
      "Dynamic Sri Lankan Poruwa & church checklists",
      "Budget calculator & vendor team organizer",
      "Guest list, meal & seating arrangement manager",
    ],
  },
  {
    role: "VENDOR",
    badge: "For Wedding Pros",
    headline: "I'm a wedding vendor",
    tagline: "Showcase your storefront, packages, and book couples looking across Sri Lanka.",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80",
    icon: Store,
    accentClass: "border-indigo-500/30 hover:border-indigo-500/70",
    glowClass: "from-indigo-500/15 via-sky-500/10 to-transparent",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
    features: [
      "Verified storefront listing & high-res gallery",
      "Direct inquiry inbox & couple lead manager",
      "Custom packages & pricing menu builder",
      "Client reviews & authentic verification badge",
    ],
  },
];

// ─── Top Header Navigation ──────────────────────────────────────────────────

function RegisterHeader({
  step,
  onBack,
}: {
  step: "pick" | "wizard" | "credentials";
  onBack: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 px-2 sm:px-3">
      <div className="flex min-w-0 items-center gap-2">
        {step !== "pick" ? (
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Icon icon={ArrowLeft} size="xs" className="text-foreground" />
            <span className="hidden sm:inline">Back</span>
          </motion.button>
        ) : null}

        <Link href="/" className="flex items-center gap-2 pl-1">
          <span className="flex size-8 items-center justify-center rounded-full border border-primary/35 font-serif text-xs text-primary">
            CW
          </span>
          <span className="hidden font-serif text-sm sm:inline">{t("app.name")}</span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {[
          { n: 1, label: "Role", active: step === "pick", done: step !== "pick" },
          { n: 2, label: "Details", active: step === "wizard", done: step === "credentials" },
          { n: 3, label: "Account", active: step === "credentials", done: false },
        ].map((item, index) => (
          <div key={item.n} className="flex items-center gap-1.5">
            {index > 0 ? <span className="text-muted-foreground/40">→</span> : null}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : item.done
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {item.n}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Role Picker ─────────────────────────────────────────────────────

function RolePicker({
  onSelect,
}: {
  onSelect: (role: "COUPLE" | "VENDOR") => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      key="picker"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 sm:gap-4"
    >
      <div className="shrink-0 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-0.5 text-[11px] font-semibold text-foreground">
          <Icon icon={Sparkles} size="xs" lottie={false} className="text-primary" /> Welcome to Ceylon Weddings
        </span>
        <h1 className="mt-2 font-serif text-xl font-semibold tracking-tight sm:text-3xl">
          How would you like to use the platform?
        </h1>
        <p className="mx-auto mt-1 hidden max-w-lg text-sm leading-relaxed text-muted-foreground sm:block">
          Select your registration path. We&apos;ll configure your workspace with tailored features.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2 sm:gap-4">
        {ROLE_OPTIONS.map((opt) => (
          <motion.button
            key={opt.role}
            type="button"
            aria-label={`Register as ${opt.role === "COUPLE" ? "a couple" : "a vendor"}`}
            onClick={() => onSelect(opt.role)}
            whileHover={reduce ? undefined : { y: -4 }}
            whileTap={reduce ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "group relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-card transition-shadow duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-3xl",
              opt.accentClass,
            )}
          >
            <div className="relative h-20 shrink-0 overflow-hidden bg-secondary sm:h-[34%] sm:min-h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opt.image}
                alt=""
                className="size-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
              <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-xl border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-md">
                <Icon icon={opt.icon} size="sm" lottie={false} className="text-primary" />
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4 sm:p-5">
              <div className="shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                    opt.badgeClass,
                  )}
                >
                  {opt.badge}
                </span>
                <h2 className="mt-1.5 font-serif text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                  {opt.headline}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{opt.tagline}</p>
              </div>

              <ul className="hidden min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-hidden border-t border-border/40 pt-3 text-[11px] text-muted-foreground sm:flex sm:text-xs">
                {opt.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Icon icon={Check} size="xs" lottie={false} className="shrink-0 text-primary" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="flex shrink-0 items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs font-semibold text-foreground">Get Started</span>
                <span className="grid size-7 place-items-center rounded-full bg-foreground/10 text-foreground transition-all group-hover:bg-foreground group-hover:text-background">
                  <Icon icon={ArrowRight} size="xs" lottie={false} />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="shrink-0 pb-1 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Sign in here
        </Link>
      </p>
    </motion.div>
  );
}

// ─── Step 3: Credential Form ─────────────────────────────────────────────────

function CredentialForm({
  role,
  coupleData,
  vendorData,
  onBack,
  onComplete,
}: {
  role: "COUPLE" | "VENDOR";
  coupleData?: CoupleWizardData | null;
  vendorData?: VendorWizardData | null;
  onBack: () => void;
  onComplete: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const currency = usePreferenceStore((state) => state.currency) as Currency;
  const setUser = useAuthStore((state) => state.setUser);
  const reduce = useReducedMotion();

  const [name, setName] = useState(() => coupleData?.partnerOneName ?? "");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const strength = useMemo(() => passwordStrength(password), [password]);
  const listingSlug = useMemo(() => slugifyVendorName(businessName), [businessName]);

  const roleOption = ROLE_OPTIONS.find((o) => o.role === role)!;

  async function handleSaveWizardData() {
    if (role === "COUPLE" && coupleData) {
      await api.wedding.update({
        partnerOneName: coupleData.partnerOneName,
        partnerTwoName: coupleData.partnerTwoName,
        date: coupleData.date || null,
        city: coupleData.city || null,
        district: coupleData.district || null,
        planningFromOverseas: coupleData.planningFromOverseas,
        types: coupleData.types,
        guestCountEstimate: coupleData.guestCountEstimate,
        style: coupleData.style,
        colors: STYLE_COLORS[coupleData.style],
        seedMissingTasks: true,
        completeOnboarding: true,
      });
    } else if (role === "VENDOR" && vendorData) {
      await api.vendors.updateMine({ category: vendorData.categorySlug });
      if (Object.keys(vendorData.attributes).length > 0) {
        await api.vendors.putAttributes({ values: vendorData.attributes });
      }
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setPending(true);
    try {
      const result = await api.register({
        email,
        password,
        name,
        role,
        locale,
        currency,
        ...(role === "VENDOR" ? { businessName } : {}),
      });
      setUser(result.user);

      // Save configured wizard details
      try {
        await handleSaveWizardData();
      } catch {
        // Non-blocking if update fails
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
        const result = await api.google({ code, role, locale, currency });
        setUser(result.user);

        // Save configured wizard details
        try {
          await handleSaveWizardData();
        } catch {
          // Non-blocking
        }

        onComplete();
      } finally {
        setPending(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.googleMissing");
      setError(message === "GOOGLE_MISSING" ? t("auth.googleMissing") : message);
    }
  }

  const meterWidth =
    strength.label === "empty" ? "0%" : strength.label === "weak" ? "33%" : strength.label === "fair" ? "66%" : "100%";
  const meterColor =
    strength.label === "strong" ? "bg-success" : strength.label === "fair" ? "bg-warning" : "bg-destructive";
  const meterLabel =
    strength.label === "empty"
      ? null
      : strength.label === "weak"
        ? t("auth.strengthWeak")
        : strength.label === "fair"
          ? t("auth.strengthFair")
          : t("auth.strengthStrong");

  return (
    <motion.div
      key="credentials"
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -20 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto grid w-full max-w-lg gap-6"
    >
      {/* Summary Banner Card */}
      <div className="flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-border/60 bg-background text-foreground">
            <Icon icon={roleOption.icon} size="md" className="text-foreground" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {role === "COUPLE" ? "Couple Planning Space" : "Vendor Storefront"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {role === "COUPLE" && coupleData?.partnerOneName && coupleData?.partnerTwoName
                ? `${coupleData.partnerOneName} & ${coupleData.partnerTwoName}`
                : role === "VENDOR" && vendorData?.categoryLabel
                  ? vendorData.categoryLabel
                  : roleOption.headline}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Edit details
        </button>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <header className="mb-6">
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Save your details and step into your personalized planning suite.
          </p>
        </header>

        <form onSubmit={onSubmit} className="grid gap-4">
          {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

          <FieldBlock label={role === "COUPLE" ? "Your Name" : "Contact Person Name"} htmlFor="name">
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder={role === "COUPLE" ? "e.g. Nimali" : "Your full name"}
              className="h-11"
            />
          </FieldBlock>

          {role === "VENDOR" ? (
            <FieldBlock
              label="Business / Brand Name"
              htmlFor="businessName"
              hint={listingSlug ? `Listing URL: /vendors/${listingSlug}` : undefined}
            >
              <Input
                id="businessName"
                autoComplete="organization"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="e.g. Lotus Grand Studio"
                className="h-11"
              />
            </FieldBlock>
          ) : null}

          <FieldBlock label="Email Address" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="h-11"
            />
          </FieldBlock>

          <FieldBlock
            label="Password"
            htmlFor="password"
            hint={meterLabel ? `${t("auth.passwordStrength")}: ${meterLabel}` : undefined}
          >
            <AuthPasswordField
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
              maxLength={72}
            />
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-all duration-300", meterColor)}
                style={{ width: meterWidth }}
              />
            </div>
          </FieldBlock>

          <FieldBlock label="Confirm Password" htmlFor="confirmPassword">
            <AuthPasswordField
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              minLength={8}
              maxLength={72}
            />
          </FieldBlock>

          <Button
            type="submit"
            disabled={pending}
            size="lg"
            icon={pending ? undefined : ShieldCheck}
            className="mt-2 w-full gap-2 shadow-lg shadow-primary/20"
          >
            {pending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Creating your account...</span>
              </>
            ) : (
              <span>Complete Registration & Open Dashboard</span>
            )}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.orContinueWith")}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="w-full gap-2 h-11"
            onClick={onGoogle}
          >
            <GoogleMark />
            {t("auth.google")}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            By creating an account, you agree to Ceylon Weddings Terms of Service & Privacy Policy.
          </p>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Main Page Container ─────────────────────────────────────────────────────

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<"COUPLE" | "VENDOR">(() => roleFromParam(searchParams.get("role")));
  const [step, setStep] = useState<"pick" | "wizard" | "credentials">(() => {
    const raw = searchParams.get("role");
    return raw ? "wizard" : "pick";
  });

  const [coupleData, setCoupleData] = useState<CoupleWizardData | null>(null);
  const [vendorData, setVendorData] = useState<VendorWizardData | null>(null);

  useEffect(() => {
    const raw = searchParams.get("role");
    if (raw) {
      const resolved = roleFromParam(raw);
      setRole(resolved);
      setStep("wizard");
    }
  }, [searchParams]);

  function handleRoleSelect(selected: "COUPLE" | "VENDOR") {
    setRole(selected);
    setStep("wizard");
  }

  function handleGlobalBack() {
    if (step === "credentials") {
      setStep("wizard");
    } else if (step === "wizard") {
      setStep("pick");
    }
  }

  function handleCoupleProceed(data: CoupleWizardData) {
    setCoupleData(data);
    setStep("credentials");
  }

  function handleVendorProceed(data: VendorWizardData) {
    setVendorData(data);
    setStep("credentials");
  }

  function handleComplete() {
    if (role === "VENDOR") {
      router.push("/pro/storefront");
    } else {
      router.push("/planning");
    }
  }

  return (
    <PageFrame lock header={<RegisterHeader step={step} onBack={handleGlobalBack} />}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/10 via-rose-500/5 to-transparent blur-3xl"
      />
      <main
        className={cn(
          "relative flex min-h-0 flex-1 flex-col px-4 sm:px-6 lg:px-8",
          step === "pick" ? "overflow-hidden py-3 sm:py-4" : "overflow-y-auto py-5",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === "pick" ? (
            <RolePicker key="pick" onSelect={handleRoleSelect} />
          ) : step === "wizard" ? (
            <motion.div
              key={`wizard-${role}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {role === "COUPLE" ? (
                <CoupleWizardInline
                  initialData={coupleData ?? undefined}
                  onBack={handleGlobalBack}
                  onProceed={handleCoupleProceed}
                />
              ) : (
                <VendorWizardInline
                  initialData={vendorData ?? undefined}
                  onBack={handleGlobalBack}
                  onProceed={handleVendorProceed}
                />
              )}
            </motion.div>
          ) : (
            <CredentialForm
              key="credentials"
              role={role}
              coupleData={coupleData}
              vendorData={vendorData}
              onBack={handleGlobalBack}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </main>
    </PageFrame>
  );
}
