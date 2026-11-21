"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Flag,
  Heart,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminInsights, AdminJobHealth, AdminStats } from "@ceylonweddings/contracts";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import {
  ColumnChart,
  DonutChart,
  KpiCard,
  RankedBars,
  TrendChart,
  WidgetEmpty,
  WidgetError,
  periodTrend,
  seriesTone,
  type ChartTone,
} from "@ceylonweddings/ui/domain/dashboard";
import { Link } from "@/i18n/navigation";
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
import { ADMIN_WIDGETS, ADMIN_WIDGET_CATEGORIES, useAdminDashboardLayout } from "./admin-widgets";

const ROLE_LABEL: Record<string, string> = { COUPLE: "Couples", FAMILY: "Family", VENDOR: "Vendors", ADMIN: "Admins" };
const ROLE_TONE: Record<string, ChartTone> = { COUPLE: "love", FAMILY: "4", VENDOR: "1", ADMIN: "info" };
const MODERATION_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
  HIDDEN: "Hidden",
};
const MODERATION_TONE: Record<string, ChartTone> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  HIDDEN: "muted",
};

type Data = { stats: AdminStats | null; insights: AdminInsights | null; jobs: AdminJobHealth | null };
type Errors = { stats?: string; insights?: string; jobs?: string };

function QueueRow({
  href,
  icon: Glyph,
  label,
  value,
  tone,
}: {
  href: string;
  icon: typeof Inbox;
  label: string;
  value: number;
  tone: "warning" | "danger" | "info" | "muted";
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      >
        <span className="inline-grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Glyph className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-compact">{label}</span>
        <span
          className={
            value > 0
              ? tone === "danger"
                ? "badge badge--danger tabular-nums"
                : tone === "warning"
                  ? "badge badge--warning tabular-nums"
                  : "badge badge--info tabular-nums"
              : "badge badge--default tabular-nums"
          }
        >
          {count(value)}
        </span>
        <ArrowRight
          className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
}

const SHORTCUTS = [
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/weddings", label: "Weddings", icon: Heart },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/admin/featured", label: "Featured", icon: Star },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
  { href: "/admin/content", label: "Content", icon: ImageIcon },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
] as const;

export default function AdminHomePage() {
  const [data, setData] = useState<Data>({ stats: null, insights: null, jobs: null });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Each source loads on its own so one slow / failing endpoint never blanks the dashboard.
  const load = useCallback(async () => {
    setLoading(true);
    const [stats, insights, jobs] = await Promise.allSettled([
      api.admin.stats(),
      api.admin.insights(),
      api.admin.jobHealth(),
    ]);
    setData((prev) => ({
      stats: stats.status === "fulfilled" ? stats.value : prev.stats,
      insights: insights.status === "fulfilled" ? insights.value : prev.insights,
      jobs: jobs.status === "fulfilled" ? jobs.value : prev.jobs,
    }));
    const message = (result: PromiseSettledResult<unknown>) =>
      result.status === "rejected"
        ? result.reason instanceof Error
          ? result.reason.message
          : "Request failed"
        : undefined;
    setErrors({ stats: message(stats), insights: message(insights), jobs: message(jobs) });
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { stats, insights, jobs } = data;
  const retry = () => void load();

  function renderWidget(id: string, { variant }: WidgetRenderContext): ReactNode {
    const needsStats = id.startsWith("kpi_") || id === "queues";
    if (needsStats && !stats) return errors.stats ? <WidgetError message={errors.stats} onRetry={retry} /> : null;
    const needsInsights = id.startsWith("trend_") || id.startsWith("donut_") || id === "bars_categories";
    if (needsInsights && !insights)
      return errors.insights ? <WidgetError message={errors.insights} onRetry={retry} /> : null;

    switch (id) {
      case "kpi_pending_verify":
        return (
          <KpiCard
            variant={variant}
            icon={ShieldAlert}
            label="Pending verification"
            value={count(stats!.vendorsPendingVerify)}
            hint="Listings waiting for trust review"
            tone="warning"
            status={
              stats!.vendorsPendingVerify > 0
                ? { label: "Review", tone: "warning" }
                : { label: "Clear", tone: "success" }
            }
          />
        );
      case "kpi_open_reports":
        return (
          <KpiCard
            variant={variant}
            icon={Flag}
            label="Open reports"
            value={count(stats!.reportsOpen)}
            hint="Abuse & takedown inbox"
            tone={stats!.reportsOpen > 0 ? "danger" : "success"}
            status={stats!.reportsOpen > 0 ? { label: "Action", tone: "danger" } : { label: "Clear", tone: "success" }}
          />
        );
      case "kpi_new_inquiries":
        return (
          <KpiCard
            variant={variant}
            icon={Inbox}
            label="New inquiries"
            value={count(stats!.inquiriesNew)}
            hint={insights ? `${count(insights.totals.inquiries.current)} sent in 30 days` : "Awaiting a vendor reply"}
            tone="info"
            sparkline={insights ? tail(insights.series.inquiries) : undefined}
            trend={
              insights ? periodTrend(insights.totals.inquiries.current, insights.totals.inquiries.previous) : undefined
            }
          />
        );
      case "kpi_vendors": {
        const verifiedPct = stats!.vendorsTotal ? (stats!.vendorsVerified / stats!.vendorsTotal) * 100 : 0;
        return (
          <KpiCard
            variant={variant}
            icon={Store}
            label="Vendors"
            value={count(stats!.vendorsTotal)}
            hint={`${count(stats!.vendorsVerified)} verified · ${count(stats!.vendorsHidden)} hidden`}
            tone="success"
            ring={verifiedPct}
            visualLabel="Verified"
          />
        );
      }
      case "kpi_users":
        return (
          <KpiCard
            variant={variant}
            icon={Users}
            label="Accounts"
            value={count(stats!.usersTotal)}
            hint={`${count(stats!.usersSuspended)} suspended`}
            tone="primary"
            sparkline={insights ? tail(insights.series.signups) : undefined}
            trend={
              insights ? periodTrend(insights.totals.signups.current, insights.totals.signups.previous) : undefined
            }
          />
        );
      case "kpi_weddings":
        return (
          <KpiCard
            variant={variant}
            icon={Heart}
            label="Weddings"
            value={count(stats!.weddingsTotal)}
            hint="Plans on the platform"
            tone="love"
          />
        );
      case "kpi_featured":
        return (
          <KpiCard
            variant={variant}
            icon={Star}
            label="Featured"
            value={count(stats!.vendorsFeatured)}
            hint={`${count(stats!.placementsActive)} placements live`}
            tone="premium"
          />
        );
      case "kpi_picks":
        return (
          <KpiCard
            variant={variant}
            icon={Sparkles}
            label="Picks gate fails"
            value={count(stats!.vendorsGateFailFeaturedCandidates)}
            hint="Verified, not yet presentable"
            tone="warning"
          />
        );
      case "kpi_drafts":
        return (
          <KpiCard
            variant={variant}
            icon={FileText}
            label="Draft articles"
            value={count(stats!.articlesDraft)}
            hint="Ideas CMS"
            tone="info"
          />
        );
      case "kpi_consultations":
        return insights ? (
          <KpiCard
            variant={variant}
            icon={CalendarClock}
            label="Upcoming consultations"
            value={count(insights.consultationsUpcoming)}
            hint="Booked from today"
            tone="info"
          />
        ) : errors.insights ? (
          <WidgetError message={errors.insights} onRetry={retry} />
        ) : null;
      case "trend_engagement":
        return (
          <TrendChart
            ariaLabel="Storefront engagement, last 30 days"
            labels={days(insights!.series.profileViews)}
            formatLabel={shortDay}
            series={[
              { key: "views", label: "Profile views", tone: "1", values: values(insights!.series.profileViews) },
              { key: "taps", label: "WhatsApp taps", tone: "success", values: values(insights!.series.whatsappTaps) },
            ]}
          />
        );
      case "trend_signups":
        return (
          <TrendChart
            ariaLabel="Sign-ups, last 30 days"
            labels={days(insights!.series.signups)}
            formatLabel={shortDay}
            series={[
              { key: "couples", label: "Couples & family", tone: "love", values: values(insights!.series.signups) },
              { key: "vendors", label: "Vendors", tone: "1", values: values(insights!.series.newVendors) },
            ]}
          />
        );
      case "trend_inquiries":
        return (
          <ColumnChart
            ariaLabel="Inquiries per day"
            tone="info"
            formatLabel={shortDay}
            data={insights!.series.inquiries.map((p) => ({ label: p.date, value: p.value }))}
          />
        );
      case "donut_roles": {
        const slices = insights!.usersByRole
          .filter((r) => r.count > 0)
          .map((r) => ({
            key: r.role,
            label: ROLE_LABEL[r.role] ?? r.role,
            value: r.count,
            tone: ROLE_TONE[r.role] ?? "muted",
          }));
        return slices.length ? (
          <DonutChart ariaLabel="Accounts by role" slices={slices} centerLabel="accounts" />
        ) : (
          <WidgetEmpty title="No accounts yet" />
        );
      }
      case "donut_moderation": {
        const slices = insights!.vendorsByModeration
          .filter((r) => r.count > 0)
          .map((r) => ({
            key: r.status,
            label: MODERATION_LABEL[r.status] ?? r.status,
            value: r.count,
            tone: MODERATION_TONE[r.status] ?? "muted",
          }));
        return slices.length ? (
          <DonutChart ariaLabel="Listings by moderation status" slices={slices} centerLabel="listings" />
        ) : (
          <WidgetEmpty title="No listings yet" icon={Store} />
        );
      }
      case "bars_categories": {
        const rows = insights!.vendorsByCategory.slice(0, 8);
        return rows.length ? (
          <RankedBars
            rows={rows.map((r, i) => ({ key: r.category, label: r.label, value: r.count, tone: seriesTone(i) }))}
          />
        ) : (
          <WidgetEmpty title="No listings yet" icon={Store} />
        );
      }
      case "queues":
        return (
          <ul className="grid gap-0.5">
            <QueueRow
              href="/admin/queues/verify"
              icon={ShieldAlert}
              label="Verify listings"
              value={stats!.vendorsPendingVerify}
              tone="warning"
            />
            <QueueRow
              href="/admin/queues/picks"
              icon={Sparkles}
              label="Ceylon Picks candidates"
              value={stats!.vendorsGateFailFeaturedCandidates}
              tone="info"
            />
            <QueueRow
              href="/admin/queues/reports"
              icon={Flag}
              label="Reports"
              value={stats!.reportsOpen}
              tone="danger"
            />
            <QueueRow
              href="/admin/inquiries"
              icon={Inbox}
              label="Unanswered inquiries"
              value={stats!.inquiriesNew}
              tone="warning"
            />
            <QueueRow
              href="/admin/consultations"
              icon={CalendarClock}
              label="Upcoming consultations"
              value={insights?.consultationsUpcoming ?? 0}
              tone="info"
            />
            <QueueRow
              href="/admin/content"
              icon={FileText}
              label="Draft articles"
              value={stats!.articlesDraft}
              tone="muted"
            />
          </ul>
        );
      case "email_health": {
        if (!jobs) return errors.jobs ? <WidgetError message={errors.jobs} onRetry={retry} /> : null;
        const q = jobs.emailQueue;
        const pending = q.waiting + q.active + q.delayed;
        return (
          <div className="grid gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-h2 leading-none tabular-nums">{count(q.completed)}</span>
              <span className="text-caption text-muted-foreground">emails sent</span>
              <span className={q.failed > 0 ? "badge badge--danger ml-auto" : "badge badge--success ml-auto"}>
                {q.failed > 0 ? `${count(q.failed)} failed` : "Healthy"}
              </span>
            </div>
            <RankedBars
              max={Math.max(pending + q.failed, 1)}
              rows={[
                { key: "waiting", label: "Waiting", value: q.waiting, tone: "info" },
                { key: "active", label: "Sending", value: q.active, tone: "success" },
                { key: "delayed", label: "Delayed", value: q.delayed, tone: "warning" },
                { key: "failed", label: "Failed", value: q.failed, tone: "danger" },
              ]}
            />
          </div>
        );
      }
      case "shortcuts":
        return (
          <ul className="grid grid-cols-2 gap-2 @container sm:grid-cols-4">
            {SHORTCUTS.map(({ href, label, icon: Glyph }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-full flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-2 py-3 text-center text-caption transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Glyph className="size-4 text-primary" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  }

  function renderHeaderActions(id: string): ReactNode {
    const link = (href: string, label = "Open") => <WidgetHeaderLink href={href}>{label}</WidgetHeaderLink>;
    if (id === "bars_categories") return link("/admin/categories", "Categories");
    if (id === "donut_moderation") return link("/admin/vendors", "Vendors");
    if (id === "donut_roles") return link("/admin/users", "Users");
    if (id === "trend_inquiries") return link("/admin/inquiries", "Inquiries");
    return null;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        icon={LayoutDashboard}
        kicker="Admin"
        title="Operations"
        description="Queues, trust and marketplace health at a glance. Press ⌘K to jump."
      />
      <WidgetDashboard
        kind="admin"
        store={useAdminDashboardLayout}
        widgets={ADMIN_WIDGETS}
        categories={ADMIN_WIDGET_CATEGORIES}
        renderWidget={renderWidget}
        renderHeaderActions={renderHeaderActions}
        toolbar={<DashboardToolbar label="Last 30 days" updatedAt={updatedAt} refreshing={loading} onRefresh={retry} />}
      />
    </div>
  );
}
