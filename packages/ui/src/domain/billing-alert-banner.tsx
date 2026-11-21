"use client";

import { AlertTriangle, Clock, Sparkles, X } from "lucide-react";
import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { cn } from "../lib/utils";

/** Mirrors `@ceylonweddings/contracts` `BillingAlert` without a UI→contracts dep. */
export type BillingAlert = "none" | "trial_ending" | "trial_active" | "grace" | "expired" | "canceling" | "comped";

export type BillingAlertBannerModel = {
  alert: BillingAlert;
  title: string;
  message: string;
  ctaLabel?: string | null;
  tone: "info" | "warning" | "danger" | "success";
};

export function resolveBillingAlertBanner(input: {
  billingAlert?: BillingAlert | null;
  daysRemaining?: number | null;
  planName?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: string | null;
}): BillingAlertBannerModel | null {
  const alert = input.billingAlert ?? "none";
  if (alert === "none") return null;

  const days = input.daysRemaining ?? 0;
  const plan = input.planName ? ` (${input.planName})` : "";
  const periodEnd = input.currentPeriodEnd
    ? new Date(input.currentPeriodEnd).toLocaleDateString("en-LK", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  switch (alert) {
    case "trial_ending":
      return {
        alert,
        tone: "warning",
        title: "Trial ending soon",
        message: `Your free trial ends in ${days} day${days === 1 ? "" : "s"}. Subscribe to keep your storefront visible.`,
        ctaLabel: "Choose a plan",
      };
    case "trial_active":
      return {
        alert,
        tone: "success",
        title: "Free trial active",
        message: `${days} day${days === 1 ? "" : "s"} left on your complimentary Pro trial.`,
        ctaLabel: "View plans",
      };
    case "grace":
      return {
        alert,
        tone: "danger",
        title: "Grace period",
        message: `Your listing stays visible for ${days} more day${days === 1 ? "" : "s"}. Subscribe now to avoid being hidden.`,
        ctaLabel: "Subscribe now",
      };
    case "expired":
      return {
        alert,
        tone: "danger",
        title: "Subscription expired",
        message: "Your storefront is hidden from the public catalog. Subscribe to restore visibility.",
        ctaLabel: "Restore access",
      };
    case "canceling":
      return {
        alert,
        tone: "warning",
        title: "Cancellation scheduled",
        message: periodEnd
          ? `Your membership${plan} stays active until ${periodEnd}. You can reactivate anytime before then.`
          : `Your membership${plan} will end at the close of the current period.`,
        ctaLabel: "Manage billing",
      };
    case "comped":
      return {
        alert,
        tone: "info",
        title: "Complimentary access",
        message:
          days >= 900
            ? "Your listing has complimentary Pro access."
            : `Complimentary access ends in ${days} day${days === 1 ? "" : "s"}.`,
        ctaLabel: "View plans",
      };
    default:
      return null;
  }
}

export function BillingAlertBanner({
  model,
  onCta,
  onDismiss,
  className,
}: {
  model: BillingAlertBannerModel;
  onCta?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const toneClass =
    model.tone === "danger"
      ? "border-destructive/30 bg-destructive/5 text-foreground"
      : model.tone === "warning"
        ? "border-warning/30 bg-warning/5 text-foreground"
        : model.tone === "success"
          ? "border-success/30 bg-success/5 text-foreground"
          : "border-border/70 bg-card/80 text-foreground";

  const IconComp =
    model.tone === "danger" || model.tone === "warning" ? AlertTriangle : model.tone === "success" ? Sparkles : Clock;

  return (
    <div
      className={cn("flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3", toneClass, className)}
      data-slot="billing-alert-banner"
      data-alert={model.alert}
    >
      <Icon icon={IconComp} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 grid gap-1">
        <p className="text-sm font-medium">{model.title}</p>
        <p className="text-xs text-muted-foreground">{model.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {model.ctaLabel && onCta ? (
          <Button type="button" size="sm" onClick={onCta}>
            {model.ctaLabel}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button type="button" size="icon" variant="ghost" aria-label="Dismiss" onClick={onDismiss}>
            <Icon icon={X} size="sm" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
