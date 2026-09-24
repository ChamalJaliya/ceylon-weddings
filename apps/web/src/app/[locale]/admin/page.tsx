"use client";

import { useEffect, useState } from "react";
import {
  Flag,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminAnalyticsSummary, AdminJobHealth, AdminStats } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { DashboardStats } from "@ceylonweddings/ui/domain/dashboard-layout";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { StatCard } from "@ceylonweddings/ui/domain/stat-card";
import { Link } from "../../../i18n/navigation";

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [jobs, setJobs] = useState<AdminJobHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.admin.stats(), api.admin.analytics(), api.admin.jobHealth()])
      .then(([nextStats, nextAnalytics, nextJobs]) => {
        setStats(nextStats);
        setAnalytics(nextAnalytics);
        setJobs(nextJobs);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading ops…</p>;
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={LayoutDashboard}
        kicker="Admin"
        title="Operations"
        description="Queue-first trust, content, and support. Press ⌘K to jump."
      />
      <DashboardStats>
        <StatCard icon={ShieldAlert} label="Pending verify" value={String(stats.vendorsPendingVerify)} hint="Needs review" tone="info" />
        <StatCard icon={Sparkles} label="Gate fails" value={String(stats.vendorsGateFailFeaturedCandidates)} hint="Pick candidates" />
        <StatCard icon={Flag} label="Open reports" value={String(stats.reportsOpen)} hint="Abuse inbox" tone="warning" />
        <StatCard icon={Inbox} label="Draft articles" value={String(stats.articlesDraft)} hint="Ideas CMS" />
      </DashboardStats>
      <DashboardStats>
        <StatCard icon={Store} label="Vendors" value={String(stats.vendorsTotal)} hint={`${stats.vendorsVerified} verified`} tone="success" />
        <StatCard icon={Users} label="Users" value={String(stats.usersTotal)} hint={`${stats.usersSuspended} suspended`} />
        <StatCard icon={Store} label="Featured" value={String(stats.vendorsFeatured)} hint={`${stats.placementsActive} placements`} />
        <StatCard icon={Inbox} label="New inquiries" value={String(stats.inquiriesNew)} hint={`${stats.weddingsTotal} weddings`} />
      </DashboardStats>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard
          title="Verify queue"
          icon={ShieldAlert}
          delay={1}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/queues/verify">Open</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">{stats.vendorsPendingVerify} listings waiting for trust review.</p>
        </SectionCard>
        <SectionCard
          title="Ceylon Picks"
          icon={Sparkles}
          delay={2}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/queues/picks">Open</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            {stats.vendorsGateFailFeaturedCandidates} verified vendors still fail the presentation gate.
          </p>
        </SectionCard>
        <SectionCard
          title="Reports"
          icon={Flag}
          delay={3}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/queues/reports">Open</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">{stats.reportsOpen} open abuse / takedown reports.</p>
        </SectionCard>
        <SectionCard
          title="Categories"
          icon={LayoutGrid}
          delay={3}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/categories">Open</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">Visual mosaic of all vendor categories and listing counts.</p>
        </SectionCard>
      </div>
      {(analytics || jobs) && (
        <div className="grid gap-4 md:grid-cols-2">
          {analytics ? (
            <SectionCard title="Analytics (7d)" icon={LayoutDashboard}>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                <li>Profile views: {analytics.profileViews7d}</li>
                <li>WhatsApp taps: {analytics.whatsappTaps7d}</li>
                <li>Inquiries: {analytics.inquiries7d}</li>
                <li>Article views: {analytics.articleViews7d}</li>
              </ul>
            </SectionCard>
          ) : null}
          {jobs ? (
            <SectionCard title="Email job health" icon={Inbox}>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                <li>Waiting: {jobs.emailQueue.waiting}</li>
                <li>Active: {jobs.emailQueue.active}</li>
                <li>Failed: {jobs.emailQueue.failed}</li>
                <li>Completed: {jobs.emailQueue.completed}</li>
              </ul>
            </SectionCard>
          ) : null}
        </div>
      )}
    </div>
  );
}
