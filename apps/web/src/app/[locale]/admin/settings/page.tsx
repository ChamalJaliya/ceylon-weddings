"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Flag, Layers, Link2, Settings, Sparkles, Trophy } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { FeatureFlag, SiteConfig } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../i18n/navigation";

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

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Settings}
        kicker="Platform"
        title="Settings"
        description="Control homepage copy, branding, CMS pages, feature flags, and awards for the public site."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: "/admin/settings/site",
            title: "Site & homepage",
            body: "Hero, stats, categories, SEO, logo, and contact details.",
            icon: Sparkles,
          },
          {
            href: "/admin/settings/pages",
            title: "Static pages",
            body: "About, FAQ, terms, privacy, and contact CMS bodies.",
            icon: FileText,
          },
          {
            href: "/admin/settings/categories",
            title: "Vendor types",
            body: "Questions, options, required/optional, help text, and couple filters.",
            icon: Layers,
          },
          {
            href: "/admin/settings/flags",
            title: "Feature flags",
            body: "Gate reviews, awards, ideas, ads, and maintenance mode.",
            icon: Flag,
          },
          {
            href: "/admin/settings/awards",
            title: "Awards",
            body: "Nominate vendors and promote winners to the public page.",
            icon: Trophy,
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/40"
          >
            <card.icon className="mb-2 size-4 text-primary" />
            <p className="font-medium">{card.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>
          </Link>
        ))}
      </div>

      <SectionCard title="Related content controls" icon={Link2}>
        <p className="mb-3 text-sm text-muted-foreground">
          Ideas articles, ad campaigns, and featured inventory stay in their own admin areas.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/content">Content (Ideas)</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/ads">Ads</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/featured">Featured</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Maintenance shortcut" icon={Flag}>
        <p className="mb-3 text-sm text-muted-foreground">
          Toggle the public maintenance banner. Message is edited under Site branding.
        </p>
        <Button
          size="sm"
          disabled={!site || saving}
          onClick={async () => {
            if (!site) return;
            setSaving(true);
            try {
              const enabled = !(maintenance?.enabled || maintenanceFlag?.enabled);
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
          }}
        >
          {maintenance?.enabled || maintenanceFlag?.enabled ? "Disable maintenance" : "Enable maintenance"}
        </Button>
      </SectionCard>
    </div>
  );
}
