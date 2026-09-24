"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api, formatMoney, RATES_TO_LKR, usePreferenceStore } from "@ceylonweddings/web";
import type { SubscriptionPlan, Vendor, VendorSubscription } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { Pricing, type BillingInterval, type PricingPlan } from "@ceylonweddings/ui/domain/pricing";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SubscriptionStatusBanner } from "@ceylonweddings/ui/domain/subscription-status-banner";
import { Link } from "../../../../i18n/navigation";

const PRO_FEATURES = [
  "Direct WhatsApp couple inquiries with verified lead alerts",
  "High-resolution media projects, galleries, and showcase videos",
  "Instant ranking priority in district & category catalog search",
  "Real customer reviews collection & verified rating score",
  "Inclusion in promotional spotlight & featured candidate queues",
  "Dedicated analytics dashboard: profile views & contact CTRs",
];

export default function VendorBillingPage() {
  const currency = usePreferenceStore((state) => state.currency);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>("ANNUAL");

  useEffect(() => {
    async function loadData() {
      try {
        const v = await api.vendors.mine();
        setVendor(v);
        if (v?.id) {
          const [sub, availablePlans] = await Promise.all([
            api.subscription.vendor(v.id).catch(() => null),
            api.subscription.plans().catch(() => []),
          ]);
          setSubscription(sub);
          setPlans(availablePlans);
        }
      } catch (err) {
        console.error("Failed to load vendor billing details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleCheckout(planId: string, interval: BillingInterval) {
    if (!vendor?.id) return;
    setCheckingOut(planId);
    try {
      const checkout = await api.subscription.checkout({
        vendorId: vendor.id,
        planId,
        interval,
        returnUrl: `${window.location.origin}/pro/billing?status=success`,
        cancelUrl: `${window.location.origin}/pro/billing?status=cancelled`,
      });

      if (checkout?.actionUrl && checkout?.fields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = checkout.actionUrl;
        Object.entries(checkout.fields).forEach(([key, val]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Unable to initiate payment. Please contact Ceylon Weddings support.");
    } finally {
      setCheckingOut(null);
    }
  }

  const displayPlans = useMemo((): PricingPlan[] => {
    const rate = RATES_TO_LKR[currency] ?? 1;
    const monthlyLkr = plans.find((p) => p.interval === "MONTHLY")?.priceLkr ?? 4900;
    const annualLkr = plans.find((p) => p.interval === "ANNUAL")?.priceLkr ?? 45000;
    const monthly = monthlyLkr / rate;
    const yearlyMonthly = annualLkr / 12 / rate;

    return [
      {
        name: "Standard Partner",
        price: 0,
        yearlyPrice: 0,
        period: "first 3 months",
        priceLabel: "Free",
        features: [
          "Standard directory listing",
          "Up to 3 portfolio photos",
          "Basic contact form inquiries",
        ],
        description: "Basic listing for emerging professionals starting their wedding portfolio.",
        buttonText: "Current default tier",
        isPopular: false,
        disabled: true,
      },
      {
        name: "Ceylon Weddings Pro",
        price: monthly,
        yearlyPrice: yearlyMonthly,
        period: "month",
        features: PRO_FEATURES,
        description: "Full visibility across Sri Lanka and diaspora couples planning weddings. Secured by PayHere (Visa, MasterCard, FriMi, eZ Cash, Genie).",
        buttonText: checkingOut ? "Please wait…" : "Subscribe via PayHere",
        isPopular: true,
        loading: checkingOut !== null,
        onSelect: (interval) => {
          const target = plans.find((p) => p.interval === interval) || plans[0];
          if (target) void handleCheckout(target.id, interval);
        },
      },
      {
        name: "Spotlight",
        price: 0,
        yearlyPrice: 0,
        period: "campaign",
        priceLabel: "Custom",
        features: [
          "Catalog top and home pick placements",
          "District and category targeting",
          "Creative studio with completeness checklist",
          "Pay only when you want extra visibility",
        ],
        description: "Boost a campaign on top of Pro when you have dates to fill.",
        buttonText: "Create a campaign",
        href: "/pro/promote",
        isPopular: false,
      },
    ];
  }, [checkingOut, currency, plans, vendor?.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-lg font-semibold">Vendor Profile Required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please register or claim your vendor storefront before managing subscriptions.
        </p>
        <Button asChild className="mt-4">
          <Link href="/for-vendors">Create Storefront</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pro Billing & Subscriptions"
        description="Manage your Ceylon Weddings vendor storefront membership, plans, and invoices"
      />

      {subscription ? (
        <SubscriptionStatusBanner
          status={subscription.status}
          daysRemaining={subscription.daysRemaining}
          trialEndsAt={subscription.trialEndsAt}
          currentPeriodEnd={subscription.currentPeriodEnd}
          planName={subscription.plan?.name}
          onUpgradeClick={() => {
            const targetPlan = plans.find((p) => p.interval === selectedInterval) || plans[0];
            if (targetPlan) void handleCheckout(targetPlan.id, selectedInterval);
          }}
        />
      ) : null}

      <Pricing
        plans={displayPlans}
        title={null}
        description={null}
        currency={currency}
        defaultAnnual
        annualSavingsLabel="Save 25%"
        linkAs={Link}
        onIntervalChange={setSelectedInterval}
        className="overflow-visible py-2"
      />

      <SectionCard title="Payment & Invoice History" icon={FileText}>
        {subscription?.invoices && subscription.invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscription.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium">
                      {new Date(inv.createdAt).toLocaleDateString("en-LK")}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{inv.paymentRef || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(inv.periodStart).toLocaleDateString("en-LK")} –{" "}
                      {new Date(inv.periodEnd).toLocaleDateString("en-LK")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(inv.amountLkr, currency)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No previous invoices recorded yet. Invoices will appear here automatically upon subscription renewals.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
