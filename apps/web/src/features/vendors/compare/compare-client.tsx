"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api, formatMoney, useCompareStore, usePreferenceStore } from "@ceylonweddings/web";
import { formatVendorStartingPriceLabel, type Vendor } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { ArrowLeft, Check, Plus, Scale } from "lucide-react";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { cn } from "@ceylonweddings/ui/utils";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { VendorCompareBoard, type VendorCompareColumn } from "@ceylonweddings/ui/domain/vendor-compare-board";
import { Link, useRouter } from "@/i18n/navigation";
import { CATEGORY_LABELS, formatAttributeDisplay, localizedText } from "@/lib/labels";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { SponsoredPromoStrip } from "@/components/sponsored-promo-strip";

function toColumn(
  vendor: Vendor,
  currency: Parameters<typeof formatMoney>[1],
  locale: string,
  categoryLabel: string,
  inquirePricing: string,
): VendorCompareColumn {
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    category: categoryLabel,
    location: `${vendor.city}, ${vendor.district}`,
    priceLabel: formatVendorStartingPriceLabel(vendor, (value) => formatMoney(value, currency), inquirePricing),
    priceValue: vendor.showPricing === false ? null : vendor.startingPriceLkr,
    typicalSpendLabel:
      vendor.showPricing === false
        ? inquirePricing
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
    packageNames: (vendor.packages ?? []).slice(0, 4).map((pkg) => pkg.name),
    inclusionHighlights: vendor.includedInPrice?.slice(0, 4) ?? [],
    serviceAreas: vendor.serviceAreas ?? [],
    travelNote: vendor.travelNote,
    overtimeNote: vendor.overtimeNote,
    attributes: (vendor.attributes ?? [])
      .map((chip) => ({
        key: chip.key,
        label: localizedText(chip.label, locale),
        display: formatAttributeDisplay(chip, locale),
      }))
      .filter((row) => row.display),
  };
}

export default function VendorComparePage() {
  const t = useTranslations();
  const locale = useLocale();
  const currency = usePreferenceStore((state) => state.currency);
  const items = useCompareStore((state) => state.items);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [columns, setColumns] = useState<VendorCompareColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});
  const [compareCategory, setCompareCategory] = useState<string | undefined>();

  const slugs = useMemo(() => {
    const fromQuery = searchParams.get("slugs");
    if (fromQuery) {
      return fromQuery
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return items.map((item) => item.slug);
  }, [searchParams, items]);

  useEffect(() => {
    void api
      .vendorTypes()
      .then((types) => {
        const next: Record<string, string> = {};
        for (const type of types) {
          next[type.slug] = localizedText(type.label, locale) || CATEGORY_LABELS[type.slug] || type.slug;
        }
        setTypeLabels(next);
      })
      .catch(() => setTypeLabels({}));
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (slugs.length < 2) {
        setColumns([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const vendors = await Promise.all(slugs.map((slug) => api.vendors.get(slug)));
        if (cancelled) return;
        const categories = new Set(vendors.map((vendor) => vendor.category));
        if (categories.size > 1) {
          setError("Compare works best with the same category. Clear mixed picks and try again.");
        }
        setCompareCategory(vendors[0]?.category);
        setColumns(
          vendors.map((vendor) =>
            toColumn(
              vendor,
              currency,
              locale,
              typeLabels[vendor.category] ?? CATEGORY_LABELS[vendor.category] ?? vendor.category,
              t("knotly.inquirePricing"),
            ),
          ),
        );
      } catch (err) {
        if (!cancelled) {
          setColumns([]);
          setError(err instanceof Error ? err.message : "Could not load compare");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slugs, currency, locale, typeLabels, t]);

  function syncQuery(nextSlugs: string[]) {
    if (nextSlugs.length) {
      router.replace(`/vendors/compare?slugs=${nextSlugs.join(",")}`);
    } else {
      router.replace("/vendors/compare");
    }
  }

  return (
    <div className="grid min-w-0 gap-6 pb-16">
      <PlanningHero
        icon={Scale}
        kicker="Marketplace"
        title="Compare vendors"
        description="Price, packages, logistics and reviews side by side — pick the stronger fit before you message."
        actions={
          <>
            {columns.length ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clear();
                  syncQuery([]);
                  setColumns([]);
                }}
              >
                Clear all
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={compareCategory ? `/vendors?category=${compareCategory}` : "/vendors"}>
                <ArrowLeft className="size-4" />
                Back to catalog
              </Link>
            </Button>
          </>
        }
      />

      {loading ? <CenteredLoader label="Loading comparison…" /> : null}
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

      {!loading && columns.length < 2 ? (
        <section className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  "grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed",
                  index < columns.length ? "border-primary/40 bg-primary/5" : "border-border",
                )}
              >
                <span className="grid justify-items-center gap-2 text-sm text-muted-foreground">
                  <span className="grid size-11 place-items-center rounded-full bg-secondary">
                    {index < columns.length ? <Check className="size-5 text-primary" /> : <Plus className="size-5" />}
                  </span>
                  {index < columns.length
                    ? columns[index]!.name
                    : index === 2
                      ? "Optional third"
                      : `Vendor ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
          <div className="grid max-w-xl gap-3">
            <h2 className="font-serif text-3xl tracking-tight">Pick 2–3 vendors from the same category</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tap the <Scale className="inline size-3.5" /> scale on any vendor card in the catalog, then come back
              here. Or start with an example:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm">
                <Link href="/vendors/compare?slugs=glen-receptions,kandy-hills-estate,fort-lawn-galle">
                  Try 3 venues
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/vendors?category=VENUE">Browse venues</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/vendors?category=PHOTO_VIDEO">Browse photographers</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {columns.length >= 2 ? (
        <>
          <VendorCompareBoard
            title={`${columns.length} ${columns[0]?.category ?? "vendors"}`}
            columns={columns}
            addHref={`/${locale}/vendors${compareCategory ? `?category=${compareCategory}` : ""}`}
            onView={(slug) => router.push(`/vendors/${slug}`)}
            onRemove={(slug) => {
              remove(slug);
              const next = columns.filter((column) => column.slug !== slug).map((column) => column.slug);
              setColumns(columns.filter((column) => column.slug !== slug));
              syncQuery(next);
            }}
          />
          {columns.length === 2 ? (
            <SponsoredPromoStrip
              slot="COMPARE_SUGGEST"
              eyebrow="Sponsored"
              title="Add a third option"
              category={compareCategory}
              excludeVendorSlugs={columns.map((column) => column.slug)}
              limit={1}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
