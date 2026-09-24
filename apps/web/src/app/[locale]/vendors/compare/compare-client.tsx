"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api, formatMoney, useCompareStore, usePreferenceStore } from "@ceylonweddings/web";
import { formatVendorStartingPriceLabel, type Vendor } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import {
  VendorCompareBoard,
  type VendorCompareColumn,
} from "@ceylonweddings/ui/domain/vendor-compare-board";
import { Link, useRouter } from "../../../../i18n/navigation";
import { CATEGORY_LABELS, formatAttributeDisplay, localizedText } from "../../../../lib/labels";

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
    priceLabel: formatVendorStartingPriceLabel(
      vendor,
      (value) => formatMoney(value, currency),
      inquirePricing,
    ),
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
    <div className="grid gap-8 pb-16">
      <PageHeader
        kicker="Marketplace"
        title="Vendor vs vendor"
        description="Side-by-side pricing, packages, travel, and trust — pick the stronger fit before you WhatsApp."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/vendors">Back to catalog</Link>
            </Button>
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
          </div>
        }
      />

      {loading ? <p className="text-sm text-muted-foreground">Loading comparison…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && columns.length < 2 ? (
        <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/30 p-8">
          <p className="font-serif text-2xl tracking-tight">Add 2–3 vendors from the catalog</p>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Tap the scale icon on catalog cards (same category), then open Compare. Or try a seeded venue pair:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/vendors/compare?slugs=glen-receptions,kandy-hills-estate,fort-lawn-galle">
                Compare 3 venues
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/vendors?category=VENUE">Browse venues</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/vendors?category=PHOTO_VIDEO">Browse photo & video</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {columns.length >= 2 ? (
        <VendorCompareBoard
          title={`Compare ${columns[0]?.category ?? "vendors"}`}
          columns={columns}
          onView={(slug) => router.push(`/vendors/${slug}`)}
          onRemove={(slug) => {
            remove(slug);
            const next = columns.filter((column) => column.slug !== slug).map((column) => column.slug);
            setColumns(columns.filter((column) => column.slug !== slug));
            syncQuery(next);
          }}
        />
      ) : null}
    </div>
  );
}
