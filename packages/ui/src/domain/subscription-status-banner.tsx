"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, Clock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { AnimatedCounter, Reveal } from "./motion";

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED" | "COMPED";

export type SubscriptionStatusBannerProps = {
  status: SubscriptionStatus;
  daysRemaining: number;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  planName?: string | null;
  onUpgradeClick?: () => void;
  className?: string;
};

export function SubscriptionStatusBanner({
  status,
  daysRemaining,
  trialEndsAt,
  currentPeriodEnd,
  planName,
  onUpgradeClick,
  className,
}: SubscriptionStatusBannerProps) {
  if (status === "ACTIVE" && daysRemaining > 14) {
    return null; // Don't clutter UI when active with plenty of time remaining
  }

  const getConfig = () => {
    switch (status) {
      case "TRIAL":
        if (daysRemaining <= 7) {
          return {
            variant: "warning" as const,
            icon: Clock,
            title: "Free Trial Ending Soon",
            description: `Your 3-month free trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Subscribe to maintain storefront visibility.`,
            cta: "Choose a Plan",
            badge: "Trial Ending",
            badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
            bannerBg: "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-100",
            buttonStyle: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20",
          };
        }
        return {
          variant: "info" as const,
          icon: Sparkles,
          title: "3-Month Free Trial Active",
          description: `You have `,
          counterValue: daysRemaining,
          descriptionSuffix: ` days remaining in your complimentary vendor trial.`,
          cta: "View Plans",
          badge: "Free Trial",
          badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          bannerBg: "bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-50",
          buttonStyle: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
        };

      case "GRACE":
        return {
          variant: "danger" as const,
          icon: AlertTriangle,
          title: "Trial Period Ended — Grace Period Active",
          description: `Your trial has expired. You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of grace period left before your listing is hidden from search.`,
          cta: "Subscribe Now",
          badge: "Grace Period",
          badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
          bannerBg: "bg-rose-500/5 border-rose-500/20 text-rose-950 dark:text-rose-50",
          buttonStyle: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
        };

      case "EXPIRED":
        return {
          variant: "expired" as const,
          icon: AlertTriangle,
          title: "Subscription Expired — Listing Hidden",
          description: "Your vendor profile is currently hidden from public search and catalog. Subscribe now to instantly restore visibility.",
          cta: "Re-activate Storefront",
          badge: "Expired",
          badgeBg: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
          bannerBg: "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-50",
          buttonStyle: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 animate-pulse",
        };

      case "COMPED":
        return {
          variant: "comped" as const,
          icon: ShieldCheck,
          title: "Complimentary Partner Access",
          description: "You have full partner access granted by CeylonWeddings editorial support.",
          cta: null,
          badge: "Verified Partner",
          badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
          bannerBg: "bg-purple-500/5 border-purple-500/20 text-purple-950 dark:text-purple-50",
          buttonStyle: "",
        };

      case "ACTIVE":
      default:
        return {
          variant: "active" as const,
          icon: CheckCircle,
          title: `${planName || "Pro"} Subscription Active`,
          description: `Renews in ${daysRemaining} days. All storefront features enabled.`,
          cta: "Manage Billing",
          badge: "Active",
          badgeBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
          bannerBg: "bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-50",
          buttonStyle: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Reveal direction="down" distance={10}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-sm",
          config.bannerBg,
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-xs border border-border/50">
              <Icon className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm tracking-tight">{config.title}</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    config.badgeBg,
                  )}
                >
                  {config.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                {config.description}
                {config.counterValue !== undefined && (
                  <span className="font-bold text-foreground mx-1">
                    <AnimatedCounter value={config.counterValue} />
                  </span>
                )}
                {config.descriptionSuffix}
              </p>
            </div>
          </div>

          {config.cta && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer",
                config.buttonStyle,
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{config.cta}</span>
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}
