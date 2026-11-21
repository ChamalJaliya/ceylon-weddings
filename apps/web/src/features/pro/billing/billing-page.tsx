"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, History, Sparkles } from "lucide-react";
import { api, formatMoney, RATES_TO_LKR, usePreferenceStore } from "@ceylonweddings/web";
import {
  type PaymentProvider,
  type SubscriptionPlan,
  type Vendor,
  type VendorSubscription,
  VENDOR_PLAN_SLUGS,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { FilterChip } from "@ceylonweddings/ui/domain/async-list";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { BillingAlertBanner, resolveBillingAlertBanner } from "@ceylonweddings/ui/domain/billing-alert-banner";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { Pricing, type BillingInterval, type PricingPlan } from "@ceylonweddings/ui/domain/pricing";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { SubscriptionStatusBanner } from "@ceylonweddings/ui/domain/subscription-status-banner";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const INVOICE_COLUMNS = ["date", "reference", "period", "amount", "status"] as const;

const SUPPORT_MAIL = "mailto:support@ceylonweddings.lk?subject=Vendor%20membership%20inquiry";

function groupPlansBySlug(plans: SubscriptionPlan[]) {
  const map = new Map<string, SubscriptionPlan[]>();
  for (const plan of plans) {
    const list = map.get(plan.slug) ?? [];
    list.push(plan);
    map.set(plan.slug, list);
  }
  return [...map.entries()].sort((a, b) => (a[1][0]?.sortOrder ?? 0) - (b[1][0]?.sortOrder ?? 0));
}

export default function VendorBillingPage() {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const currency = usePreferenceStore((state) => state.currency);
  const plansRef = useRef<HTMLDivElement>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>("ANNUAL");
  const [provider, setProvider] = useState<PaymentProvider>("payhere");
  const [providers, setProviders] = useState<{
    payhere: boolean;
    stripe: boolean;
    defaultProvider: PaymentProvider;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const v = await api.vendors.mine();
      setVendor(v);
      if (!v?.id) return;

      const [pricing, fallbackPlans, sub, available] = await Promise.all([
        api.subscription.pricing().catch(() => null),
        api.subscription.plans().catch(() => [] as SubscriptionPlan[]),
        api.subscription.vendor(v.id).catch(() => null),
        api.subscription.providers().catch(() => null),
      ]);
      setPlans(pricing?.plans?.length ? pricing.plans : fallbackPlans);
      setSubscription(sub);
      if (available) {
        setProviders(available);
        setProvider(available.defaultProvider);
      }
    } catch (err) {
      console.error("Failed to load vendor billing details", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchParams.get("status") !== "success" || !vendor?.id) return;
    toast.success("Payment received — refreshing your membership.");
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    window.history.replaceState({}, "", url.pathname + url.search);
    void loadData();
  }, [searchParams, vendor?.id, loadData]);

  async function handleCheckout(
    planId: string,
    interval: BillingInterval,
    checkoutProvider: PaymentProvider = provider,
  ) {
    if (!vendor?.id) return;
    setCheckingOut(planId);
    try {
      const checkout = await api.subscription.checkout({
        vendorId: vendor.id,
        planId,
        interval,
        provider: checkoutProvider,
        returnUrl: `${window.location.origin}/pro/billing?status=success`,
        cancelUrl: `${window.location.origin}/pro/billing?status=cancelled`,
      });

      if (checkout.provider === "stripe" && checkout.actionUrl) {
        window.location.href = checkout.actionUrl;
        return;
      }

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
        return;
      }

      toast.error("Checkout did not return a payment URL.");
    } catch (err) {
      console.error("Checkout failed", err);
      toast.error("Unable to initiate payment. Please contact Ceylon Weddings support.");
    } finally {
      setCheckingOut(null);
    }
  }

  function scrollToPlans() {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function planForInterval(slug: string, interval: BillingInterval) {
    return plans.find((p) => p.slug === slug && p.interval === interval);
  }

  const displayPlans = useMemo((): PricingPlan[] => {
    const rate = RATES_TO_LKR[currency] ?? 1;
    const grouped = groupPlansBySlug(plans);

    return grouped.map(([, variants]) => {
      const monthly = variants.find((p) => p.interval === "MONTHLY");
      const annual = variants.find((p) => p.interval === "ANNUAL");
      const lead = monthly ?? annual ?? variants[0];
      const features = lead.displayFeatures?.length ? lead.displayFeatures : lead.features;
      const monthlyLkr = monthly?.priceLkr ?? annual?.priceLkr ?? 0;
      const annualLkr = annual?.priceLkr ?? (monthly ? monthly.priceLkr * 12 : monthlyLkr);
      const isContact = lead.billingMode === "contact";
      const isSpotlight = lead.slug === VENDOR_PLAN_SLUGS.SPOTLIGHT;

      if (isContact) {
        return {
          name: lead.name,
          price: 0,
          yearlyPrice: 0,
          period: "campaign",
          priceLabel: "Custom",
          features,
          description: lead.description ?? "Talk to our team for custom placement and pricing.",
          buttonText: isSpotlight ? "Create a campaign" : "Contact sales",
          href: isSpotlight ? "/pro/promote" : undefined,
          onSelect: isSpotlight
            ? undefined
            : () => {
                window.location.href = SUPPORT_MAIL;
              },
          isPopular: lead.recommended,
        };
      }

      const price = monthlyLkr / rate;
      const yearlyMonthly = annualLkr / 12 / rate;

      return {
        name: lead.name,
        price,
        yearlyPrice: yearlyMonthly,
        period: "month",
        features,
        description:
          lead.description ??
          "Full visibility across Sri Lanka and diaspora couples. Pay with PayHere (LKR) or Stripe (international cards).",
        buttonText: checkingOut
          ? "Please wait…"
          : provider === "stripe"
            ? "Subscribe with Stripe"
            : "Subscribe with PayHere",
        isPopular: lead.recommended,
        loading: checkingOut !== null,
        onSelect: (interval) => {
          const target = planForInterval(lead.slug, interval) ?? monthly ?? annual;
          if (target) void handleCheckout(target.id, interval);
        },
      };
    });
  }, [checkingOut, currency, plans, provider]);

  const billingAlert = useMemo(
    () =>
      subscription
        ? resolveBillingAlertBanner({
            billingAlert: subscription.billingAlert,
            daysRemaining: subscription.daysRemaining,
            planName: subscription.plan?.name,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.currentPeriodEnd,
          })
        : null,
    [subscription],
  );

  const events = useMemo(
    () => [...(subscription?.events ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [subscription?.events],
  );

  const pendingPlan = useMemo(() => {
    if (!subscription?.pendingPlanId) return null;
    return plans.find((p) => p.id === subscription.pendingPlanId) ?? null;
  }, [plans, subscription?.pendingPlanId]);

  const invoices = subscription?.invoices ?? [];
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    invoices,
    25,
    subscription?.id ?? "",
  );

  if (loading) {
    return <CenteredLoader label="Loading billing" className="h-96" />;
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <h2 className="text-lg font-medium">Vendor Profile Required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please register or claim your vendor storefront before managing subscriptions.
        </p>
        <Button asChild className="mt-4">
          <Link href="/for-vendors">Create Storefront</Link>
        </Button>
      </div>
    );
  }

  const defaultCheckoutPlan =
    plans.find((p) => p.interval === selectedInterval && p.billingMode === "checkout") ?? plans[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pro Billing & Subscriptions"
        description="Manage your Ceylon Weddings vendor storefront membership, plans, and invoices"
      />

      {billingAlert ? (
        <BillingAlertBanner
          model={billingAlert}
          onCta={() => {
            const subscribeAlerts = new Set(["trial_ending", "grace", "expired"]);
            if (subscribeAlerts.has(billingAlert.alert) && defaultCheckoutPlan) {
              void handleCheckout(defaultCheckoutPlan.id, selectedInterval);
              return;
            }
            scrollToPlans();
          }}
        />
      ) : null}

      {subscription ? (
        <SubscriptionStatusBanner
          status={subscription.status}
          daysRemaining={subscription.daysRemaining}
          trialEndsAt={subscription.trialEndsAt}
          currentPeriodEnd={subscription.currentPeriodEnd}
          planName={subscription.plan?.name}
          onUpgradeClick={() => {
            if (defaultCheckoutPlan) void handleCheckout(defaultCheckoutPlan.id, selectedInterval);
            else scrollToPlans();
          }}
        />
      ) : null}

      {providers?.payhere && providers.stripe ? (
        <SectionCard title="Payment method" icon={Sparkles}>
          <p className="mb-3 text-sm text-muted-foreground">
            PayHere for Sri Lanka (LKR, FriMi, eZ Cash, local cards). Stripe for international cards (USD).
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={provider === "payhere"} onClick={() => setProvider("payhere")}>
              PayHere · LKR
            </FilterChip>
            <FilterChip active={provider === "stripe"} onClick={() => setProvider("stripe")}>
              Stripe · International
            </FilterChip>
          </div>
        </SectionCard>
      ) : null}

      <div ref={plansRef} id="membership-plans">
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
      </div>

      {subscription ? (
        <SectionCard title="Membership" icon={Sparkles}>
          <SettingsList>
            {pendingPlan || subscription.pendingInterval ? (
              <SettingsListRow
                title="Scheduled change"
                description={[pendingPlan?.name, subscription.pendingInterval].filter(Boolean).join(" · ")}
              />
            ) : null}
            {subscription.cancelAtPeriodEnd ? (
              <SettingsListRow
                title="Cancellation scheduled"
                description="Your plan stays active until the end of the current billing period."
                actions={
                  <Button
                    size="sm"
                    disabled={acting}
                    onClick={async () => {
                      setActing(true);
                      try {
                        const next = await api.subscription.reactivate(vendor.id);
                        setSubscription(next);
                        toast.success("Membership reactivated.");
                      } catch {
                        toast.error("Could not reactivate. Try again or contact support.");
                      } finally {
                        setActing(false);
                      }
                    }}
                  >
                    Reactivate
                  </Button>
                }
              />
            ) : (
              <SettingsListRow
                title="Cancel membership"
                description="Stops renewal at the end of your current period. Your listing stays live until then."
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting || subscription.status === "CANCELLED"}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Cancel at period end?",
                        description:
                          "You will keep Pro access until the current period ends. You can reactivate before then.",
                        confirmLabel: "Cancel membership",
                        destructive: true,
                      });
                      if (!ok) return;
                      setActing(true);
                      try {
                        const next = await api.subscription.cancel(vendor.id, { atPeriodEnd: true });
                        setSubscription(next);
                        toast.success("Cancellation scheduled for period end.");
                      } catch {
                        toast.error("Could not cancel. Try again or contact support.");
                      } finally {
                        setActing(false);
                      }
                    }}
                  >
                    Cancel at period end
                  </Button>
                }
              />
            )}
          </SettingsList>
        </SectionCard>
      ) : null}

      {events.length > 0 ? (
        <SectionCard title="Recent activity" icon={History}>
          <SettingsList>
            {events.map((event) => (
              <SettingsListRow
                key={event.id}
                title={event.type.replace(/_/g, " ")}
                description={new Date(event.createdAt).toLocaleString("en-LK", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            ))}
          </SettingsList>
        </SectionCard>
      ) : null}

      <SectionCard title="Payment & Invoice History" icon={FileText}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={INVOICE_COLUMNS.length}
          sourceCount={invoices.length}
          filteredCount={invoices.length}
          empty={{
            icon: FileText,
            title: "No invoices yet",
            description: "Invoices will appear here automatically upon subscription renewals.",
          }}
          pagination={
            totalPages > 0
              ? {
                  page,
                  totalPages,
                  total,
                  limit,
                  onPageChange: setPage,
                  onLimitChange: setLimit,
                }
              : null
          }
          items={pageItems}
          getRowId={(inv) => inv.id}
          orderedVisibleIds={INVOICE_COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof INVOICE_COLUMNS)[number], string> = {
              date: "Date",
              reference: "Reference",
              period: "Period",
              amount: "Amount",
              status: "Status",
            };
            return <DataTableHead key={id}>{labels[id as (typeof INVOICE_COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, inv) => {
            switch (id) {
              case "date":
                return (
                  <DataTableCell key={id} className="text-xs font-medium">
                    {new Date(inv.createdAt).toLocaleDateString("en-LK")}
                  </DataTableCell>
                );
              case "reference":
                return (
                  <DataTableCell key={id} className="font-mono text-label text-xs">
                    {inv.paymentRef || "—"}
                  </DataTableCell>
                );
              case "period":
                return (
                  <DataTableCell key={id} className="text-xs text-muted-foreground">
                    {new Date(inv.periodStart).toLocaleDateString("en-LK")} –{" "}
                    {new Date(inv.periodEnd).toLocaleDateString("en-LK")}
                  </DataTableCell>
                );
              case "amount":
                return (
                  <DataTableCell key={id} className="text-xs font-medium">
                    {formatMoney(inv.amountLkr, currency)}
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={inv.status === "PAID" ? "success" : "warning"}>{inv.status}</Badge>
                  </DataTableCell>
                );
              default:
                return null;
            }
          }}
        />
      </SectionCard>
    </div>
  );
}
