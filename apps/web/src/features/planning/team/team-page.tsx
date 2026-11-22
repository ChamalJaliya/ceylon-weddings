"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Briefcase, CheckCircle2, Plus, Scale, Search, Trash2, Undo2 } from "lucide-react";
import { cn } from "@ceylonweddings/ui/utils";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import { formatVendorStartingPriceLabel, type Vendor, type VendorLinkStatus } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FilterChip } from "@ceylonweddings/ui/domain/async-list";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { VendorCompareTray, type VendorCompareColumn } from "@ceylonweddings/ui/domain/vendor-compare-tray";
import { Link, useRouter } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { CATEGORY_LABELS } from "@/lib/labels";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { Spinner } from "@ceylonweddings/ui/components/spinner";

const STATUSES: VendorLinkStatus[] = ["SHORTLISTED", "INQUIRED", "BOOKED"];

const STATUS_META: Record<
  VendorLinkStatus,
  { label: string; action: string; empty: string; dot: string; column: string }
> = {
  SHORTLISTED: {
    label: "Shortlisted",
    action: "Mark shortlisted",
    empty: "Save vendors from the catalog with the heart.",
    dot: "bg-info",
    column: "bg-info/[0.06]",
  },
  INQUIRED: {
    label: "Inquired",
    action: "Mark inquired",
    empty: "Move vendors here once you’ve messaged them.",
    dot: "bg-warning",
    column: "bg-warning/[0.07]",
  },
  BOOKED: {
    label: "Booked",
    action: "Mark booked",
    empty: "Booked vendors land here.",
    dot: "bg-success",
    column: "bg-success/[0.07]",
  },
};

export default function TeamPage() {
  const confirm = useConfirm();
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
    if (!(await confirm({ title: "Remove from team?", destructive: true, confirmLabel: "Remove" }))) return;
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

  const missing = data.hubStats?.missingCategories ?? [];
  const bookedCategories = new Set(grouped.BOOKED.map((item) => item.category));
  const needed = bookedCategories.size + missing.length;
  const percent = needed ? Math.round((bookedCategories.size / needed) * 100) : 0;
  const canManage = data.myAccess.canManageVendors;

  return (
    <div className={compareColumns.length >= 2 ? "cw-stack pb-80" : "cw-stack"}>
      <PlanningHero
        icon={Briefcase}
        kicker={t("hub.kicker")}
        title={t("nav.team")}
        description="Everyone you’re considering, talking to and booked — move them along as you decide."
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/vendors/compare">
                <Scale className="size-4" />
                Compare
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/vendors">
                <Search className="size-4" />
                Find vendors
              </Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {STATUSES.map((status) => (
              <div key={status} className="grid gap-0.5">
                <span className="font-serif text-4xl leading-none tabular-nums">{grouped[status].length}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-paper/70">
                  <span className={cn("size-1.5 rounded-full", STATUS_META[status].dot)} />
                  {STATUS_META[status].label}
                </span>
              </div>
            ))}
            <div className="grid min-w-48 gap-1.5 self-end">
              <span className="text-xs text-paper/70">
                {bookedCategories.size}/{needed || "—"} categories booked
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-paper/15">
                <span
                  className="block h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </span>
            </div>
          </div>
          {missing.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-paper/70">Still need</span>
              {missing.map((category) => (
                <Link
                  key={category}
                  href={`/vendors?category=${category}`}
                  className="inline-flex items-center gap-1 rounded-full border border-paper/25 px-3 py-1 text-xs transition hover:bg-paper/10"
                >
                  <Plus className="size-3" />
                  {CATEGORY_LABELS[category] ?? category}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </PlanningHero>

      {categoriesWithPeers.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <Scale className="size-4 text-primary" />
          <p className="mr-1 text-sm">Side by side:</p>
          {categoriesWithPeers.map((category) => (
            <FilterChip
              key={category}
              active={compareCategory === category}
              onClick={() => {
                if (!loadingCompare) openCompare(category);
              }}
            >
              {CATEGORY_LABELS[category] ?? category} · {data.team.filter((item) => item.category === category).length}
            </FilterChip>
          ))}
          {compareCategory && compareColumns.length >= 2 ? (
            <Button asChild size="sm" variant="ghost" className="ml-auto">
              <Link href={`/vendors/compare?slugs=${compareColumns.map((column) => column.slug).join(",")}`}>
                Full compare page
              </Link>
            </Button>
          ) : null}
          {loadingCompare ? <Spinner label="Loading" /> : null}
          {compareError ? <span className="text-xs text-destructive">{compareError}</span> : null}
        </div>
      ) : null}

      {data.team.length ? (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {STATUSES.map((status, columnIndex) => {
            const items = grouped[status];
            const meta = STATUS_META[status];
            const next = STATUSES[columnIndex + 1];
            return (
              <section key={status} className={cn("grid gap-3 rounded-3xl p-3", meta.column)}>
                <header className="flex items-center justify-between px-2 pt-1">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <span className={cn("size-2 rounded-full", meta.dot)} />
                    {meta.label}
                  </span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                </header>
                {items.map((item, index) => (
                  <article
                    key={item.vendorId}
                    className="group grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/30 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500"
                    style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                  >
                    <Link href={`/vendors/${item.slug}`} className="flex min-w-0 items-center gap-3">
                      <VendorThumb src={item.photoUrl ?? item.photos?.[0]} name={item.name} />
                      <span className="grid min-w-0 gap-0.5">
                        <span className="truncate font-serif text-lg leading-tight">{item.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                          {item.city ? ` · ${item.city}` : ""}
                        </span>
                      </span>
                    </Link>
                    {canManage ? (
                      <div className="flex items-center gap-1.5">
                        {next ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 gap-1.5"
                            onClick={() => void setStatus(item.vendorId, next)}
                          >
                            {STATUS_META[next].action}
                            <ArrowRight className="size-3.5" />
                          </Button>
                        ) : (
                          <span className="inline-flex h-8 flex-1 items-center gap-1.5 rounded-full bg-success/10 px-3 text-xs font-medium text-success">
                            <CheckCircle2 className="size-3.5" />
                            Booked
                          </span>
                        )}
                        {columnIndex > 0 ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Move back to ${STATUS_META[STATUSES[columnIndex - 1]!].label}`}
                            title={`Back to ${STATUS_META[STATUSES[columnIndex - 1]!].label}`}
                            onClick={() => void setStatus(item.vendorId, STATUSES[columnIndex - 1]!)}
                          >
                            <Undo2 className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => void removeVendor(item.vendorId)}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : null}
                  </article>
                ))}
                {!items.length ? (
                  <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {meta.empty}
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="Start your vendor team"
          description="Tap the heart on any vendor in the catalog to save them here."
          action={
            <Button asChild>
              <Link href="/vendors">Browse vendors</Link>
            </Button>
          }
        />
      )}

      <VendorCompareTray
        open={compareColumns.length >= 2}
        title={`Compare ${compareCategory ? (CATEGORY_LABELS[compareCategory] ?? compareCategory) : "vendors"}`}
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

function VendorThumb({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-love/15 font-serif text-xl text-primary">
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-14 shrink-0 rounded-xl object-cover"
    />
  );
}
