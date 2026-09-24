"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import { formatVendorStartingPriceLabel, type Vendor, type VendorLinkStatus } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { TeamMemberCard } from "@ceylonweddings/ui/domain/team-vendor";
import { TeamGapBanner } from "@ceylonweddings/ui/domain/wedding-presentation";
import {
  VendorCompareTray,
  type VendorCompareColumn,
} from "@ceylonweddings/ui/domain/vendor-compare-tray";
import { Link, useRouter } from "../../../../i18n/navigation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import { CATEGORY_LABELS } from "../../../../lib/labels";

const STATUSES: VendorLinkStatus[] = ["SHORTLISTED", "INQUIRED", "BOOKED"];

export default function TeamPage() {
  const t = useTranslations();
  const router = useRouter();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [compareCategory, setCompareCategory] = useState<string | null>(null);
  const [compareColumns, setCompareColumns] = useState<VendorCompareColumn[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const categoriesWithPeers = useMemo(() => {
    if (!data) return [] as string[];
    const counts = new Map<string, number>();
    for (const item of data.team) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count >= 2).map(([category]) => category);
  }, [data]);

  const grouped = useMemo(() => {
    const map: Record<VendorLinkStatus, NonNullable<typeof data>["team"]> = {
      SHORTLISTED: [],
      INQUIRED: [],
      BOOKED: [],
    };
    for (const item of data?.team ?? []) {
      map[item.status].push(item);
    }
    return map;
  }, [data]);

  if (!data) return <SignInPrompt error={error} />;

  async function setStatus(vendorId: string, status: VendorLinkStatus) {
    await api.wedding.updateTeamVendor(vendorId, { status });
    await reload();
  }

  async function removeVendor(vendorId: string) {
    if (!window.confirm("Remove from team?")) return;
    await api.wedding.unshortlist(vendorId);
    await reload();
  }
  async function openCompare(category: string) {
    setCompareError(null);
    setLoadingCompare(true);
    setCompareCategory(category);
    try {
      const peers = data!.team.filter((item) => item.category === category).slice(0, 3);
      const vendors = await Promise.all(peers.map((item) => api.vendors.get(item.slug)));
      setCompareColumns(
        vendors.map((vendor: Vendor) => ({
          id: vendor.id,
          name: vendor.name,
          slug: vendor.slug,
          category: CATEGORY_LABELS[vendor.category] ?? vendor.category,
          location: `${vendor.city}, ${vendor.district}`,
          priceLabel: formatVendorStartingPriceLabel(
            vendor,
            (value) => formatMoney(value, currency),
            t("knotly.inquirePricing"),
          ),
          typicalSpendLabel:
            vendor.showPricing === false
              ? t("knotly.inquirePricing")
              : vendor.typicalSpendLkr == null
                ? null
                : `~${formatMoney(vendor.typicalSpendLkr, currency)}`,
          photoUrl: vendor.photoUrl ?? vendor.photos?.[0],
          verified: vendor.verified,
          featured: vendor.featured,
          destination: vendor.destinationExperienced,
          rating: vendor.ratingAvg,
          ratingCount: vendor.ratingCount,
          yearsExperience: vendor.yearsExperience,
          couplesServed: vendor.couplesServed,
          offerHeadline: vendor.offerHeadline,
          packageNames: (vendor.packages ?? []).slice(0, 3).map((pkg) => pkg.name),
          inclusionHighlights: vendor.includedInPrice?.slice(0, 3) ?? [],
          serviceAreas: vendor.serviceAreas ?? [],
          travelNote: vendor.travelNote,
          overtimeNote: vendor.overtimeNote,
        })),
      );
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Could not load compare");
      setCompareColumns([]);
    } finally {
      setLoadingCompare(false);
    }
  }

  return (
    <div className={compareColumns.length >= 2 ? "cw-stack pb-80" : "cw-stack"}>
      <PageHeader
        icon={Briefcase}
        kicker={t("hub.kicker")}
        title={t("nav.team")}
        description="Shortlisted, inquired, and booked vendors — your visual wedding board."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/vendors/compare">Vendor vs vendor</Link>
          </Button>
        }
      />

      <TeamGapBanner
        missing={data.hubStats?.missingCategories ?? []}
        labels={CATEGORY_LABELS}
        action={
          <Button asChild size="sm">
            <Link href="/vendors">Find vendors</Link>
          </Button>
        }
      />

      {categoriesWithPeers.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <p className="text-sm text-muted-foreground">Compare same category:</p>
          {categoriesWithPeers.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={compareCategory === category ? "default" : "outline"}
              disabled={loadingCompare}
              onClick={() => openCompare(category)}
            >
              {CATEGORY_LABELS[category] ?? category}
            </Button>
          ))}
          {compareCategory && compareColumns.length >= 2 ? (
            <Button asChild size="sm" variant="secondary">
              <Link
                href={`/vendors/compare?slugs=${compareColumns.map((column) => column.slug).join(",")}`}
              >
                Full compare page
              </Link>
            </Button>
          ) : null}
          {loadingCompare ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
          {compareError ? <span className="text-xs text-destructive">{compareError}</span> : null}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
          Shortlist 2+ vendors in the same category to open the compare tray — or use{" "}
          <Link href="/vendors" className="text-primary underline-offset-2 hover:underline">
            catalog scale icons
          </Link>
          .
        </p>
      )}

      {data.team.length ? (
        <div className="cw-section">
          {STATUSES.map((status) => {
            const items = grouped[status];
            if (!items.length) return null;
            return (
              <section key={status} className="grid gap-4">
                <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  {status} · {items.length}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item, index) => (
                    <div
                      key={item.vendorId}
                      className="grid gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
                      style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                    >
                      <Link href={`/vendors/${item.slug}`} className="block">
                        <TeamMemberCard
                          name={item.name}
                          category={CATEGORY_LABELS[item.category] ?? item.category}
                          location={item.city && item.district ? `${item.city}, ${item.district}` : undefined}
                          photoUrl={item.photoUrl ?? item.photos?.[0]}
                          status={item.status}
                        />
                      </Link>
                      {data.myAccess.canManageVendors ? (
                        <div className="flex gap-2 px-1">
                          <SimpleSelect
                            className="h-9"
                            value={item.status}
                            onValueChange={(value) => setStatus(item.vendorId, value as VendorLinkStatus)}
                            options={STATUSES.map((value) => ({ value, label: value }))}
                          />
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeVendor(item.vendorId)}>
                            Remove
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={t("nav.team")}
          description="No vendors yet. Browse the marketplace and save to team."
          action={
            <Button asChild>
              <Link href="/vendors">Browse vendors</Link>
            </Button>
          }
        />
      )}

      <VendorCompareTray
        open={compareColumns.length >= 2}
        title={`Compare ${compareCategory ? CATEGORY_LABELS[compareCategory] ?? compareCategory : "vendors"}`}
        columns={compareColumns}
        onView={(slug) => router.push(`/vendors/${slug}`)}
        onClose={() => {
          setCompareColumns([]);
          setCompareCategory(null);
        }}
      />
    </div>
  );
}
