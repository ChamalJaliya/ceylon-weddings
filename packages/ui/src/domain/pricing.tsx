"use client";

import { useRef, useState, type ElementType, type ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { Check, Star } from "lucide-react";
import { buttonVariants } from "../components/button";
import { Icon } from "../components/icon";
import { Switch } from "../components/switch";
import { useMediaQuery } from "../hooks/use-media-query";
import { cn } from "../lib/utils";
import { useConfetti } from "../motion/celebration";
import { motion, useReducedMotion } from "./motion";

export type BillingInterval = "MONTHLY" | "ANNUAL";

export type PricingPlan = {
  name: string;
  /** Monthly price. Ignored when `priceLabel` is set. */
  price: number;
  /** Monthly price when billed annually. Ignored when `priceLabel` is set. */
  yearlyPrice: number;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href?: string;
  onSelect?: (interval: BillingInterval) => void;
  isPopular: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Static label such as "Free" or "Custom" — skips the number ticker. */
  priceLabel?: string;
};

type PlanLinkProps = {
  href: string;
  className?: string;
  children?: ReactNode;
};

export type PricingProps = {
  plans: PricingPlan[];
  title?: string | null;
  description?: string | null;
  currency?: string;
  locales?: string;
  defaultAnnual?: boolean;
  annualSavingsLabel?: string;
  billedMonthlyLabel?: string;
  billedAnnuallyLabel?: string;
  className?: string;
  linkAs?: ElementType<PlanLinkProps>;
  onIntervalChange?: (interval: BillingInterval) => void;
};

function fanOffset(index: number, count: number, isPopular: boolean) {
  if (count !== 3) {
    return { x: 0, y: isPopular ? -20 : 0, scale: isPopular ? 1 : 0.98 };
  }
  return {
    y: isPopular ? -20 : 0,
    x: index === 2 ? -30 : index === 0 ? 30 : 0,
    scale: index === 0 || index === 2 ? 0.94 : 1,
  };
}

export function Pricing({
  plans,
  title = "Simple, transparent pricing",
  description = "Choose the plan that works for you.\nEvery plan includes a Ceylon Weddings storefront, WhatsApp leads, and support.",
  currency = "LKR",
  locales = "en-LK",
  defaultAnnual = true,
  annualSavingsLabel = "Save 25%",
  billedMonthlyLabel = "billed monthly",
  billedAnnuallyLabel = "billed annually",
  className,
  linkAs: LinkComponent = "a",
  onIntervalChange,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(!defaultAnnual);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reduce = useReducedMotion();
  const switchRef = useRef<HTMLButtonElement>(null);
  const { burst } = useConfetti();

  const fractionDigits = currency === "LKR" ? 0 : 2;
  const threeUp = plans.length === 3;

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    onIntervalChange?.(checked ? "ANNUAL" : "MONTHLY");
    if (!checked || reduce) return;
    const rect = switchRef.current?.getBoundingClientRect();
    void burst(
      rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.35 },
    );
  };

  const ctaClass = (popular: boolean) =>
    cn(
      buttonVariants({
        variant: popular ? "default" : "outline",
        size: "lg",
      }),
      "group relative w-full overflow-hidden text-base font-semibold tracking-tight",
      "ring-offset-background transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1",
      popular
        ? "bg-primary text-primary-foreground"
        : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground",
    );

  return (
    <div className={cn("w-full py-4", className)}>
      {title || description ? (
        <div className="mb-10 space-y-3 text-center">
          {title ? (
            <h2 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">{title}</h2>
          ) : null}
          {description ? (
            <p className="mx-auto max-w-2xl whitespace-pre-line text-lg text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", isMonthly ? "text-foreground" : "text-muted-foreground")}>
          Monthly
        </span>
        <Switch
          ref={switchRef}
          checked={!isMonthly}
          onCheckedChange={handleToggle}
          aria-label="Annual billing"
        />
        <span className={cn("text-sm font-semibold", !isMonthly ? "text-foreground" : "text-muted-foreground")}>
          Annual billing <span className="text-primary">({annualSavingsLabel})</span>
        </span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4 pt-4 sm:gap-5",
          threeUp ? "md:grid-cols-3" : "mx-auto md:max-w-3xl md:grid-cols-2",
          threeUp && "md:[perspective:1200px]",
        )}
      >
        {plans.map((plan, index) => {
          const amount = isMonthly ? plan.price : plan.yearlyPrice;
          const fan = fanOffset(index, plans.length, plan.isPopular);
          const linked = Boolean(plan.href) && !plan.onSelect;

          return (
            <motion.div
              key={plan.name}
              initial={reduce || !isDesktop ? false : { y: 48, opacity: 1 }}
              whileInView={
                reduce || !isDesktop ? undefined : { y: fan.y, opacity: 1, x: fan.x, scale: fan.scale }
              }
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.25,
                opacity: { duration: 0.45 },
              }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 text-center lg:justify-center",
                plan.isPopular ? "z-10 border-2 border-primary shadow-card" : "z-0 border-border",
                !plan.isPopular && "md:mt-5",
                threeUp && index === 0 && "md:origin-right md:rotate-y-[8deg] md:-translate-z-12",
                threeUp && index === 2 && "md:origin-left md:rotate-y-[-8deg] md:-translate-z-12",
              )}
            >
              {plan.isPopular ? (
                <div className="absolute top-0 right-0 flex items-center rounded-bl-xl rounded-tr-[0.9rem] bg-primary px-2.5 py-0.5">
                  <Icon icon={Star} size="sm" className="text-primary-foreground" animation="fill" />
                  <span className="ml-1 text-xs font-semibold text-primary-foreground">Popular</span>
                </div>
              ) : null}

              <div className="flex flex-1 flex-col">
                <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{plan.name}</p>

                <div className="mt-6 flex items-center justify-center gap-x-2">
                  {plan.priceLabel ? (
                    <span className="font-serif text-5xl font-medium tracking-tight text-foreground">
                      {plan.priceLabel}
                    </span>
                  ) : (
                    <NumberFlow
                      value={amount}
                      locales={locales}
                      format={{
                        style: "currency",
                        currency,
                        minimumFractionDigits: fractionDigits,
                        maximumFractionDigits: fractionDigits,
                      }}
                      transformTiming={{ duration: 500, easing: "ease-out" }}
                      respectMotionPreference
                      willChange
                      className="font-serif text-5xl font-medium tracking-tight text-foreground tabular-nums"
                    />
                  )}
                  {plan.period ? (
                    <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                      / {plan.period}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {plan.priceLabel ? "\u00a0" : isMonthly ? billedMonthlyLabel : billedAnnuallyLabel}
                </p>

                <ul className="mt-5 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-left text-sm">
                      <Icon icon={Check} size="sm" className="mt-0.5 shrink-0 text-primary" animateOnView />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <hr className="my-5 w-full border-border/70" />

                {linked && plan.href ? (
                  <LinkComponent href={plan.href} className={ctaClass(plan.isPopular)}>
                    {plan.buttonText}
                  </LinkComponent>
                ) : (
                  <button
                    type="button"
                    disabled={plan.disabled || plan.loading}
                    onClick={() => plan.onSelect?.(isMonthly ? "MONTHLY" : "ANNUAL")}
                    className={ctaClass(plan.isPopular)}
                  >
                    {plan.loading ? "Please wait…" : plan.buttonText}
                  </button>
                )}

                <p className="mt-5 text-xs leading-5 text-muted-foreground">{plan.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
