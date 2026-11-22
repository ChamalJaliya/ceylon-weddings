"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Star,
  Store,
  Target,
} from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import type { Inquiry, Vendor, VendorInsights, VendorSubscription } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { BillingAlertBanner, resolveBillingAlertBanner } from "@ceylonweddings/ui/domain/billing-alert-banner";
import { MediaFrame } from "@ceylonweddings/ui/domain/media-frame";
import {
  DonutChart,
  KpiCard,
  ProgressRing,
  TrendChart,
  WidgetEmpty,
  WidgetError,
  periodTrend,
} from "@ceylonweddings/ui/domain/dashboard";
import { Link, useRouter } from "@/i18n/navigation";
import { WidgetDashboard, type WidgetRenderContext } from "@/features/dashboard/widget-dashboard";
import {
  DashboardToolbar,
  count,
  days,
  shortDay,
  tail,
  values,
  WidgetHeaderLink,
} from "@/features/dashboard/dashboard-format";
import { VENDOR_WIDGETS, VENDOR_WIDGET_CATEGORIES, useVendorDashboardLayout } from "./vendor-widgets";

type Lead = Inquiry & { wedding: { partnerOneName: string; partnerTwoName: string } };

const LEAD_STATUS = {
  NEW: { label: "New", intent: "warning", tone: "warning" },
  REPLIED: { label: "Replied", intent: "info", tone: "info" },
  CLOSED: { label: "Closed", intent: "default", tone: "muted" },
} as const;

const SUBSCRIPTION_LABEL: Record<string, string> = {
  TRIAL: "Free trial",
  ACTIVE: "Active",
  GRACE: "Grace period",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  COMPED: "Complimentary",
};

const humanize = (key: string) => key.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-LK", { day: "numeric", month: "short", timeZone: "Asia/Colombo" });

export default function ProHomePage() {
  const router = useRouter();
  const currency = usePreferenceStore((state) => state.currency);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [insights, setInsights] = useState<VendorInsights | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, inbox] = await Promise.all([api.vendors.mine(), api.vendors.leads()]);
      setVendor(mine);
      setLeads(inbox);
      setError(null);
      // Secondary sources never block the dashboard.
      const [nextInsights, sub] = await Promise.allSettled([api.vendors.insights(), api.subscription.vendor(mine.id)]);
      if (nextInsights.status === "fulfilled") {
        setInsights(nextInsights.value);
        setInsightsError(null);
      } else {
        setInsightsError(nextInsights.reason instanceof Error ? nextInsights.reason.message : "Request failed");
      }
      if (sub.status === "fulfilled") setSubscription(sub.value);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !vendor) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }
  if (!vendor) return <CenteredLoader label="Loading…" />;

  const packages = vendor.packages ?? [];
  const published = packages.filter((pkg) => pkg.status === "PUBLISHED");
  const newLeads = (leads ?? []).filter((lead) => lead.status === "NEW").length;
  const completeness = vendor.completeness;
  const cover = vendor.photoUrl ?? vendor.photos?.[0];
  const billingAlert = subscription
    ? resolveBillingAlertBanner({
        billingAlert: subscription.billingAlert,
        daysRemaining: subscription.daysRemaining,
        planName: subscription.plan?.name,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
    : null;
  const retry = () => void load();
  const insightsGate = () => (insightsError ? <WidgetError message={insightsError} onRetry={retry} /> : null);

  function renderWidget(id: string, { variant }: WidgetRenderContext): ReactNode {
    switch (id) {
      case "kpi_views":
        if (!insights) return insightsGate();
        return (
          <KpiCard
            variant={variant}
            icon={Eye}
            label="Profile views"
            value={count(insights.totals.profileViews.current)}
            hint="Last 30 days"
            tone="primary"
            sparkline={tail(insights.series.profileViews)}
            trend={periodTrend(insights.totals.profileViews.current, insights.totals.profileViews.previous)}
          />
        );
      case "kpi_taps":
        if (!insights) return insightsGate();
        return (
          <KpiCard
            variant={variant}
            icon={MessageCircle}
            label="WhatsApp taps"
            value={count(insights.totals.whatsappTaps.current)}
            hint={vendor!.whatsapp ? "Last 30 days" : "Add WhatsApp in Presence"}
            tone="success"
            sparkline={tail(insights.series.whatsappTaps)}
            trend={periodTrend(insights.totals.whatsappTaps.current, insights.totals.whatsappTaps.previous)}
          />
        );
      case "kpi_new_leads":
        if (!leads) return null;
        return (
          <KpiCard
            variant={variant}
            icon={Briefcase}
            label="New leads"
            value={count(newLeads)}
            hint={`${count(leads.length)} inquiries in total`}
            tone="warning"
            status={newLeads > 0 ? { label: "Reply", tone: "warning" } : { label: "All caught up", tone: "success" }}
            bars={insights ? tail(insights.series.inquiries) : undefined}
          />
        );
      case "kpi_inquiry_rate": {
        if (!insights) return insightsGate();
        const views = insights.totals.profileViews.current;
        const rate = views ? (insights.totals.inquiries.current / views) * 100 : 0;
        return (
          <KpiCard
            variant={variant}
            icon={Target}
            label="Inquiry rate"
            value={views ? `${rate.toFixed(rate < 10 ? 1 : 0)}%` : "—"}
            hint={`${count(insights.totals.inquiries.current)} inquiries · ${count(views)} views`}
            tone="info"
            gauge={Math.min(100, rate * 5)}
            visualLabel="vs 20%"
          />
        );
      }
      case "kpi_shortlisted":
        if (!insights) return insightsGate();
        return (
          <KpiCard
            variant={variant}
            icon={Heart}
            label="Shortlisted"
            value={count(insights.shortlistedBy)}
            hint={`${count(insights.bookedBy)} couples booked you`}
            tone="love"
            ring={insights.shortlistedBy ? (insights.bookedBy / insights.shortlistedBy) * 100 : 0}
            visualLabel="Booked"
          />
        );
      case "kpi_offers":
        return (
          <KpiCard
            variant={variant}
            icon={Package}
            label="Published offers"
            value={count(published.length)}
            hint={`${count(packages.length)} packages in total`}
            tone="premium"
            progress={packages.length ? (published.length / packages.length) * 100 : 0}
          />
        );
      case "kpi_listing":
        return (
          <KpiCard
            variant={variant}
            icon={BadgeCheck}
            label="Listing"
            value={vendor!.verified ? "Verified" : "Unverified"}
            hint={vendor!.featured ? "Featured pick" : "Trust mark"}
            tone={vendor!.verified ? "success" : "warning"}
          />
        );
      case "trend_performance":
        if (!insights) return insightsGate();
        return (
          <TrendChart
            ariaLabel="Storefront performance, last 30 days"
            labels={days(insights.series.profileViews)}
            formatLabel={shortDay}
            series={[
              { key: "views", label: "Profile views", tone: "1", values: values(insights.series.profileViews) },
              { key: "taps", label: "WhatsApp taps", tone: "success", values: values(insights.series.whatsappTaps) },
              { key: "inquiries", label: "Inquiries", tone: "love", values: values(insights.series.inquiries) },
            ]}
          />
        );
      case "leads_status": {
        if (!leads) return null;
        if (leads.length === 0) {
          return (
            <WidgetEmpty
              icon={Briefcase}
              title="No leads yet"
              description="Publish an offer so couples can reach you."
            />
          );
        }
        return (
          <DonutChart
            ariaLabel="Leads by status"
            centerLabel="leads"
            slices={(Object.keys(LEAD_STATUS) as (keyof typeof LEAD_STATUS)[]).map((status) => ({
              key: status,
              label: LEAD_STATUS[status].label,
              value: leads.filter((lead) => lead.status === status).length,
              tone: LEAD_STATUS[status].tone,
            }))}
          />
        );
      }
      case "recent_leads":
        if (!leads) return null;
        if (leads.length === 0) {
          return (
            <WidgetEmpty
              icon={Briefcase}
              title="No inquiries yet"
              description="Refine your offers and publish to start receiving leads."
            />
          );
        }
        return (
          <ul className="grid gap-1">
            {leads.slice(0, 6).map((lead) => (
              <li key={lead.id}>
                <Link
                  href="/pro/leads"
                  className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-love/15 text-love">
                    <Heart className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-compact font-medium">
                        {lead.wedding.partnerOneName} & {lead.wedding.partnerTwoName}
                      </span>
                      <Badge intent={LEAD_STATUS[lead.status].intent} className="shrink-0">
                        {LEAD_STATUS[lead.status].label}
                      </Badge>
                    </span>
                    <span className="line-clamp-1 text-caption text-muted-foreground">{lead.message}</span>
                  </span>
                  <span className="shrink-0 text-label text-muted-foreground">{dayLabel(lead.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        );
      case "completeness": {
        if (!completeness) return <WidgetEmpty title="Readiness unavailable" />;
        const pct = completeness.total ? (completeness.score / completeness.total) * 100 : 0;
        return (
          <div className="flex h-full flex-wrap items-center gap-6">
            <ProgressRing
              value={pct}
              tone={completeness.ready ? "success" : "1"}
              label={`${completeness.score} of ${completeness.total}`}
            />
            <div className="grid min-w-44 flex-1 gap-2">
              <p className="text-compact font-medium">
                {completeness.ready ? "Your storefront is ready for couples." : "Finish these to stand out:"}
              </p>
              <ul className="grid gap-1.5">
                {(completeness.missing.length
                  ? completeness.missing.slice(0, 5)
                  : ["Preview your live storefront"]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-2 text-caption text-muted-foreground">
                    {completeness.missing.length ? (
                      <Circle className="size-3.5 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden />
                    )}
                    {humanize(item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
      case "listing_preview":
        return (
          <div className="relative size-full min-h-40 overflow-hidden">
            <MediaFrame
              src={cover}
              alt={vendor!.name}
              aspect="aspect-auto"
              className="absolute inset-0 size-full rounded-none"
            />
            <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-ink/75 via-ink/30 to-transparent p-4 pt-12 text-hero-foreground">
              <div className="flex flex-wrap gap-1.5">
                {vendor!.verified ? (
                  <Badge intent="success">Verified</Badge>
                ) : (
                  <Badge intent="warning">Unverified</Badge>
                )}
                {vendor!.featured ? (
                  <Badge intent="premium">
                    <Star className="size-3" aria-hidden /> Featured
                  </Badge>
                ) : null}
              </div>
              <p className="truncate font-serif text-h4 leading-tight">/vendors/{vendor!.slug}</p>
              <Link
                href={`/vendors/${vendor!.slug}`}
                className="widget-no-drag inline-flex w-fit items-center gap-1 text-caption text-hero-foreground underline-offset-2 hover:underline"
              >
                View as a couple <ExternalLink className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        );
      case "offers":
        if (packages.length === 0) {
          return (
            <WidgetEmpty
              icon={Package}
              title="No offers yet"
              description="Packages help couples compare you at a glance."
              action={
                <Button asChild size="sm">
                  <Link href="/pro/storefront">Create an offer</Link>
                </Button>
              }
            />
          );
        }
        return (
          <ul className="grid gap-1.5">
            {packages.slice(0, 5).map((pkg) => (
              <li key={pkg.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-compact font-medium">{pkg.name}</span>
                  <span className="text-caption text-muted-foreground">
                    {pkg.priceLkr != null ? formatMoney(pkg.priceLkr, currency) : "Price on request"}
                  </span>
                </span>
                <Badge intent={pkg.status === "PUBLISHED" ? "success" : "default"}>
                  {pkg.status === "PUBLISHED" ? "Live" : "Draft"}
                </Badge>
              </li>
            ))}
          </ul>
        );
      case "membership": {
        if (!subscription)
          return (
            <WidgetEmpty
              icon={CreditCard}
              title="No membership yet"
              description="Choose a plan to keep your listing live."
            />
          );
        const trial = subscription.status === "TRIAL";
        const ends = trial ? subscription.trialEndsAt : subscription.currentPeriodEnd;
        return (
          <div className="grid h-full content-between gap-4">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-h3 leading-tight">
                  {subscription.plan?.name ?? (trial ? "Trial" : "Membership")}
                </span>
                <Badge
                  intent={
                    subscription.status === "ACTIVE" || subscription.status === "COMPED"
                      ? "success"
                      : trial
                        ? "info"
                        : "warning"
                  }
                >
                  {SUBSCRIPTION_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </div>
              {ends ? (
                <p className="text-caption text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? "Ends" : trial ? "Trial ends" : "Renews"} {dayLabel(ends)}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between text-caption">
                <span className="text-muted-foreground">Days remaining</span>
                <span className="font-medium tabular-nums">{count(Math.max(0, subscription.daysRemaining))}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className={
                    subscription.daysRemaining <= 7
                      ? "block h-full rounded-full bg-warning"
                      : "block h-full rounded-full bg-primary"
                  }
                  style={{ width: `${Math.min(100, (Math.max(0, subscription.daysRemaining) / 30) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      }
      case "next_steps":
        return (
          <ul className="grid gap-2">
            {(completeness?.missing.length
              ? completeness.missing
              : ["Preview your live storefront", "Check WhatsApp number", "Publish at least one package"]
            )
              .slice(0, 5)
              .map((item) => (
                <li key={item} className="flex items-center gap-2 text-compact">
                  <ArrowRight className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {humanize(item)}
                </li>
              ))}
          </ul>
        );
      default:
        return null;
    }
  }

  function renderHeaderActions(id: string): ReactNode {
    const link = (href: string, label: string) => <WidgetHeaderLink href={href}>{label}</WidgetHeaderLink>;
    if (id === "recent_leads" || id === "leads_status") return link("/pro/leads", "View all");
    if (id === "completeness" || id === "offers" || id === "next_steps") return link("/pro/storefront", "Studio");
    if (id === "membership") return link("/pro/billing", "Billing");
    if (id === "trend_performance") return link("/pro/promote", "Promote");
    return null;
  }

  return (
    <div className="grid gap-6">
      <section className="relative isolate grid overflow-hidden rounded-3xl text-paper shadow-raised lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <span
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 0%, transparent 60%)," +
              "radial-gradient(60% 70% at 40% 120%, color-mix(in srgb, var(--cw-gold-300) 18%, transparent) 0%, transparent 60%)," +
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 35%, var(--color-ink)) 0%, var(--color-ink) 70%)",
          }}
        />
        <div className="order-2 grid content-between gap-8 p-6 sm:p-10 lg:order-1">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-label tracking-eyebrow text-paper/60 uppercase">
              <Store className="size-3.5" /> Vendor workspace
            </p>
            <h1 className="font-serif text-4xl leading-none font-medium tracking-tight text-balance sm:text-5xl">
              {vendor.name}
            </h1>
            <p className="max-w-md text-paper/70">
              See how couples find you, and polish your storefront until they feel your work before they message.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <Link href="/pro/leads" className="group">
              <p className="font-serif text-5xl leading-none text-[color:var(--cw-gold-300)]">{newLeads}</p>
              <p className="mt-1 text-sm text-paper/70 group-hover:text-paper">
                new {newLeads === 1 ? "lead" : "leads"} →
              </p>
            </Link>
            {completeness ? (
              <Link href="/pro/storefront" className="group">
                <p className="font-serif text-3xl leading-none">
                  {completeness.total ? Math.round((completeness.score / completeness.total) * 100) : 0}%
                </p>
                <p className="mt-1 text-sm text-paper/70 group-hover:text-paper">storefront ready</p>
              </Link>
            ) : null}
            <div>
              <p className="font-serif text-3xl leading-none">{published.length}</p>
              <p className="mt-1 text-sm text-paper/70">live {published.length === 1 ? "package" : "packages"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild shape="pill" className="gap-2 bg-paper text-ink hover:bg-paper/90">
              <Link href="/pro/storefront">
                Open studio <ArrowRight className="size-4" />
              </Link>
            </Button>
            {billingAlert ? (
              <Link
                href="/pro/billing"
                className={
                  billingAlert.tone === "danger"
                    ? "inline-flex items-center gap-2 rounded-full bg-love px-3.5 py-2 text-sm text-love-foreground"
                    : "inline-flex items-center gap-2 rounded-full border border-paper/25 px-3.5 py-2 text-sm text-paper/80 transition hover:border-[color:var(--cw-gold-300)] hover:text-paper"
                }
                title={billingAlert.message}
              >
                <span
                  className={
                    billingAlert.tone === "danger"
                      ? "size-2 rounded-full bg-love-foreground"
                      : billingAlert.tone === "warning"
                        ? "size-2 rounded-full bg-[color:var(--cw-saffron-300)]"
                        : "size-2 rounded-full bg-[color:var(--cw-gold-300)]"
                  }
                />
                {billingAlert.title}
                {subscription?.daysRemaining != null && billingAlert.tone !== "danger"
                  ? ` · ${subscription.daysRemaining} days left`
                  : ""}
                <span className="opacity-70">· View plans</span>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="relative order-1 min-h-48 lg:order-2 lg:min-h-[22rem]">
          {cover ? (
            <img src={cover} alt={vendor.name} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-paper/5 text-paper/50">
              <Link href="/pro/storefront" className="text-sm underline underline-offset-4">
                Add a cover photo
              </Link>
            </div>
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent lg:bg-gradient-to-r lg:from-ink/50 lg:via-transparent"
          />
          <Button
            asChild
            size="sm"
            shape="pill"
            variant="secondary"
            className="absolute top-4 right-4 border border-background/30 bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
          >
            <Link href={`/vendors/${vendor.slug}`}>View public page</Link>
          </Button>
        </div>
      </section>

      {/* Only interrupt for billing problems; trial/active status lives in the hero. */}
      {billingAlert && (billingAlert.tone === "danger" || billingAlert.tone === "warning") ? (
        <BillingAlertBanner model={billingAlert} onCta={() => router.push("/pro/billing")} />
      ) : null}
      <WidgetDashboard
        kind="vendor"
        store={useVendorDashboardLayout}
        widgets={VENDOR_WIDGETS}
        categories={VENDOR_WIDGET_CATEGORIES}
        renderWidget={renderWidget}
        renderHeaderActions={renderHeaderActions}
        toolbar={<DashboardToolbar label="Last 30 days" updatedAt={updatedAt} refreshing={loading} onRefresh={retry} />}
      />
    </div>
  );
}
