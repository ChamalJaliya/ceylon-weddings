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
            badgeBg: "bg-status-warning-bg text-status-warning-fg border-status-warning-border",
            bannerBg: "bg-warning/5 border-warning/25 text-warning-fg",
            buttonStyle: "bg-warning hover:bg-warning/90 text-warning-foreground shadow-warning/20",
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
          badgeBg: "bg-status-success-bg text-status-success-fg border-status-success-border",
          bannerBg: "bg-success/5 border-success/25 text-success-fg",
          buttonStyle: "bg-success hover:bg-success/90 text-success-foreground shadow-success/20",
        };

      case "GRACE":
        return {
          variant: "danger" as const,
          icon: AlertTriangle,
          title: "Trial Period Ended — Grace Period Active",
          description: `Your trial has expired. You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of grace period left before your listing is hidden from search.`,
          cta: "Subscribe Now",
          badge: "Grace Period",
          badgeBg: "bg-status-danger-bg text-status-danger-fg border-status-danger-border",
          bannerBg: "bg-destructive/5 border-destructive/25 text-danger-fg",
          buttonStyle: "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20",
        };

      case "EXPIRED":
        return {
          variant: "expired" as const,
          icon: AlertTriangle,
          title: "Subscription Expired — Listing Hidden",
          description:
            "Your vendor profile is currently hidden from public search and catalog. Subscribe now to instantly restore visibility.",
          cta: "Re-activate Storefront",
          badge: "Expired",
          badgeBg: "bg-status-danger-bg text-status-danger-fg border-status-danger-border",
          bannerBg: "bg-destructive/5 border-destructive/25 text-danger-fg",
          buttonStyle:
            "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/20 animate-pulse",
        };

      case "COMPED":
        return {
          variant: "comped" as const,
          icon: ShieldCheck,
          title: "Complimentary Partner Access",
          description: "You have full partner access granted by CeylonWeddings editorial support.",
          cta: null,
          badge: "Verified Partner",
          badgeBg: "bg-status-premium-bg text-status-premium-fg border-status-premium-border",
          bannerBg: "bg-premium/5 border-premium/25 text-premium-fg",
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
          badgeBg: "bg-status-info-bg text-status-info-fg border-status-info-border",
          bannerBg: "bg-info/5 border-info/25 text-info-fg",
          buttonStyle: "bg-info hover:bg-info/90 text-info-foreground shadow-info/20",
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
                <span className="font-medium text-sm tracking-tight">{config.title}</span>
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
                  <span className="font-medium text-foreground mx-1">
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
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-xs transition-all active:scale-[0.98] cursor-pointer",
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
