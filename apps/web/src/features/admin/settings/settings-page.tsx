"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  FileText,
  Layers,
  Settings,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { api } from "@ceylonweddings/web";
import type { FeatureFlag, SiteConfig } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { Link } from "@/i18n/navigation";

export default function AdminSettingsOverviewPage() {
  const [site, setSite] = useState<SiteConfig | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextSite, nextFlags] = await Promise.all([api.admin.siteConfig(), api.admin.flags()]);
      setSite(nextSite);
      setFlags(nextFlags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  const maintenance = site?.branding.maintenanceBanner;
  const maintenanceFlag = flags.find((f) => f.key === "site.maintenance");
  const maintenanceOn = Boolean(maintenance?.enabled || maintenanceFlag?.enabled);
  const flagsOn = flags.filter((f) => f.enabled).length;

  async function toggleMaintenance() {
    if (!site) return;
    setSaving(true);
    try {
      const enabled = !maintenanceOn;
      await Promise.all([
        api.admin.updateSiteConfig({
          branding: {
            ...site.branding,
            maintenanceBanner: {
              enabled,
              message:
                site.branding.maintenanceBanner.message ||
                "We are performing scheduled maintenance. Thanks for your patience.",
            },
          },
          homepage: site.homepage,
        }),
        api.admin.upsertFlag({
          key: "site.maintenance",
          enabled,
          description: "Show the maintenance banner from branding config on public pages",
        }),
      ]);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const groups = [
    {
      title: "Marketplace",
      description: "What vendors sell and how they sign up.",
      cards: [
        {
          href: "/admin/settings/categories",
          title: "Vendor types",
          body: "Onboarding questions, answer options and the filters couples use.",
          icon: Layers,
          primary: true,
        },
        {
          href: "/admin/settings/plans",
          title: "Plans & pricing",
          body: "Membership tiers, PayHere prices, features and checkout mode.",
          icon: CreditCard,
        },
        {
          href: "/admin/settings/consultations",
          title: "Consultations",
          body: "Booking slots and rules for planner consultations.",
          icon: CalendarClock,
        },
      ],
    },
    {
      title: "Public site",
      description: "What couples see.",
      cards: [
        {
          href: "/admin/settings/site",
          title: "Site & homepage",
          body: "Hero, stats, categories, SEO, logo and contact details.",
          icon: Sparkles,
        },
        {
          href: "/admin/settings/pages",
          title: "Static pages",
          body: "About, FAQ, terms, privacy and contact.",
          icon: FileText,
        },
        {
          href: "/admin/settings/awards",
          title: "Awards",
          body: "Nominate vendors and publish winners.",
          icon: Trophy,
        },
      ],
    },
  ];

  return (
    <div className="grid gap-8">
      <PlanningHero
        icon={Settings}
        kicker="Platform"
        title="Settings"
        description="How the marketplace works, what the public site says, and which features are switched on."
      />

      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-3xl border p-4 shadow-card sm:p-5",
          maintenanceOn ? "border-warning/50 bg-warning/10" : "border-border bg-card",
        )}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            maintenanceOn ? "bg-warning/20 text-warning" : "bg-success/10 text-success",
          )}
        >
          <Wrench className="size-5" aria-hidden />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="font-medium">{maintenanceOn ? "Maintenance mode is on" : "Site is live"}</p>
          <p className="text-sm text-muted-foreground">
            {maintenanceOn
              ? maintenance?.message || "Couples see the maintenance banner."
              : `No maintenance banner · ${flagsOn}/${flags.length} feature flags on`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/settings/flags">Flags</Link>
          </Button>
          <Button
            size="sm"
            variant={maintenanceOn ? "default" : "outline"}
            disabled={!site || saving}
            onClick={() => void toggleMaintenance()}
          >
            {maintenanceOn ? "Turn off maintenance" : "Turn on maintenance"}
          </Button>
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.title} className="grid gap-3">
          <div className="grid gap-0.5 px-1">
            <h2 className="font-serif text-2xl">{group.title}</h2>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={cn(
                  "group relative grid content-start gap-3 rounded-3xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40",
                  "primary" in card && card.primary ? "border-primary/30 ring-1 ring-primary/10" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <card.icon className="size-5" aria-hidden />
                  </span>
                  <ArrowUpRight
                    className="size-4 text-muted-foreground transition group-hover:text-primary"
                    aria-hidden
                  />
                </div>
                <div className="grid gap-1">
                  <p className="font-medium">{card.title}</p>
                  <p className="text-sm text-muted-foreground">{card.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="px-1 text-sm text-muted-foreground">
        Looking for Ideas articles, ads or featured vendors? They live in{" "}
        <Link href="/admin/content" className="text-foreground underline underline-offset-4">
          Content
        </Link>
        ,{" "}
        <Link href="/admin/ads" className="text-foreground underline underline-offset-4">
          Ads
        </Link>{" "}
        and{" "}
        <Link href="/admin/featured" className="text-foreground underline underline-offset-4">
          Featured
        </Link>
        .
      </p>
    </div>
  );
}
