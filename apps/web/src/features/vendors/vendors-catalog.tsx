"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname as useNextPathname, useRouter as useNextRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  Sparkles,
  Eye,
  MapPin,
  Star,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelContent,
  FloatingPanelFooter,
  FloatingPanelHeader,
  FloatingPanelSection,
  FloatingPanelTrigger,
} from "@ceylonweddings/ui/domain/floating-panel";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import {
  api,
  clearCatalogScroll,
  consumeCatalogReturning,
  markLeavingCatalog,
  persistCatalogHref,
  readCatalogHref,
  readCatalogScroll,
  useAsyncPage,
  useAuthStore,
  useCompareStore,
  useDebouncedValue,
  usePreferenceStore,
  useSyncedQuery,
} from "@ceylonweddings/web";
import {
  catalogFilterCount,
  catalogInlineInsertIndices,
  toSearchParams,
  vendorCatalogQuerySchema,
  VENDOR_CATALOG_DEFAULTS,
  type CatalogAttrs,
  type CatalogAttrValue,
  type Promotion,
  type PublicPromotionSlotConfig,
  type PublicVendorTypeListItem,
  type Vendor,
  type VendorSort,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { VendorCard } from "@ceylonweddings/ui/domain/vendor-card";
import { VendorQuickView } from "@ceylonweddings/ui/domain/vendor-quick-view";
import { toQuickView } from "@/lib/vendor-quick-view";
import { CATEGORY_ICONS, CATEGORY_PHOTOS } from "@/lib/category-media";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import {
  AnimatePresence,
  LayoutGroup,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { VendorCompareDock } from "@ceylonweddings/ui/domain/vendor-compare-dock";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { AttributeHelp } from "@ceylonweddings/ui/domain/attribute-help";
import { ChoiceCard } from "@ceylonweddings/ui/domain/choice-card";
import {
  AsyncListGrid,
  AsyncListToolbar,
  AsyncSearchField,
  AsyncSortSelect,
  FilterChip,
  PaginationBar,
  VendorCardSkeleton,
} from "@ceylonweddings/ui/domain/async-list";
import { Link, useRouter } from "@/i18n/navigation";
import { PromotionSlotRail } from "@/components/promotion-slot-rail";
import { SponsoredPromoStrip } from "@/components/sponsored-promo-strip";
import { CATEGORY_LABELS, localizedText, priceLabel } from "@/lib/labels";

const SORT_KEYS: VendorSort[] = ["featured", "rating", "price_asc", "price_desc", "name"];

function catalogPath(query: Record<string, unknown>) {
  const qs = toSearchParams(query, VENDOR_CATALOG_DEFAULTS).toString();
  return qs ? `/vendors?${qs}` : "/vendors";
}

function typeLabel(type: PublicVendorTypeListItem | undefined, slug: string, locale: string) {
  if (type) return localizedText(type.label, locale);
  return CATEGORY_LABELS[slug] ?? slug;
}

function selectedKeys(value: CatalogAttrValue | undefined): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

function matchChipsForVendor(vendor: Vendor, attrs: CatalogAttrs | undefined, locale: string): string[] {
  if (!attrs || !vendor.attributes?.length) return [];
  const chips: string[] = [];
  for (const [key, filterValue] of Object.entries(attrs)) {
    const wanted = selectedKeys(filterValue);
    if (!wanted.length) continue;
    const chip = vendor.attributes.find((attr) => attr.key === key);
    if (!chip?.options?.length) continue;
    for (const option of chip.options) {
      if (wanted.includes(option.key)) {
        chips.push(localizedText(option.label, locale));
      }
    }
  }
  return chips;
}

export function CatalogFallback() {
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <div className="h-4 w-24 animate-pulse rounded-full bg-secondary" />
          <div className="h-10 w-48 animate-pulse rounded-full bg-secondary" />
        </div>
        <div className="h-12 min-w-72 flex-1 animate-pulse rounded-full bg-secondary sm:max-w-xl" />
      </div>
      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <VendorCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function VendorThumb({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-love/10 font-serif text-xl text-primary">
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

export function VendorsCatalog() {
  const t = useTranslations();
  const locale = useLocale();
  const currency = usePreferenceStore((state) => state.currency);
  const user = useAuthStore((state) => state.user);
  const canShortlist = user?.role === "COUPLE" || user?.role === "FAMILY";
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<"grid" | "map">("grid");
  const [compareMessage, setCompareMessage] = useState<string | null>(null);
  const [types, setTypes] = useState<PublicVendorTypeListItem[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [more, setMore] = useState(false);
  const compareItems = useCompareStore((state) => state.items);
  const toggleCompare = useCompareStore((state) => state.toggle);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [inlinePromos, setInlinePromos] = useState<Promotion[]>([]);
  const [inlineSlot, setInlineSlot] = useState<PublicPromotionSlotConfig | null>(null);
  const [sponsoredVendors, setSponsoredVendors] = useState<Vendor[]>([]);
  const removeCompare = useCompareStore((state) => state.remove);
  const clearCompare = useCompareStore((state) => state.clear);
  const hasCompare = useCompareStore((state) => state.has);
  const router = useRouter();
  const nextRouter = useNextRouter();
  const catalogPathname = useNextPathname();
  const searchParams = useSearchParams();
  const restoredRef = useRef(false);
  const searchDirty = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      nextRouter.replace(href, options);
    },
    [nextRouter],
  );
  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      nextRouter.push(href, options);
    },
    [nextRouter],
  );

  const { query, setQuery } = useSyncedQuery({
    schema: vendorCatalogQuerySchema,
    defaults: VENDOR_CATALOG_DEFAULTS,
    pathname: catalogPathname,
    searchParams,
    replace,
    push,
  });
  const [draftQ, setDraftQ] = useState(query.q ?? "");
  const [minPrice, setMinPrice] = useState(query.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice?.toString() ?? "");
  const debouncedQ = useDebouncedValue(draftQ, 300);

  useEffect(() => {
    api
      .vendorTypes()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api.promotions
      .publicSlots()
      .then(async (slots) => {
        if (cancelled) return;
        const config = slots.find((row) => row.slot === "CATALOG_INLINE") ?? null;
        setInlineSlot(config);
        if (!config?.enabled) {
          setInlinePromos([]);
          setSponsoredVendors([]);
          return;
        }
        const promos = await api.promotions.public({
          slot: "CATALOG_INLINE",
          city: query.city,
          category: query.category as never,
          limit: config.maxPerRequest,
        });
        if (cancelled) return;
        setInlinePromos(promos);
        promos.forEach((promo) => void api.promotions.impression(promo.id, { slot: "CATALOG_INLINE" }));
        const vendors = await Promise.all(
          promos.map(async (promo) => {
            if (!promo.vendorSlug) return null;
            try {
              return await api.vendors.get(promo.vendorSlug);
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) {
          setSponsoredVendors(
            vendors.filter((row): row is Vendor => {
              if (!row) return false;
              if (query.minPrice != null && (row.startingPriceLkr ?? 0) < query.minPrice) return false;
              if (query.maxPrice != null && (row.startingPriceLkr ?? Number.MAX_SAFE_INTEGER) > query.maxPrice)
                return false;
              return true;
            }),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInlineSlot(null);
          setInlinePromos([]);
          setSponsoredVendors([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query.city, query.category, query.minPrice, query.maxPrice]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (searchParams.toString()) return;
    if (!consumeCatalogReturning()) return;
    const saved = readCatalogHref();
    if (saved === "/vendors") return;
    const qs = saved.includes("?") ? saved.slice(saved.indexOf("?") + 1) : "";
    nextRouter.replace(qs ? `${catalogPathname}?${qs}` : catalogPathname, { scroll: false });
  }, [catalogPathname, nextRouter, searchParams]);

  useEffect(() => {
    persistCatalogHref(catalogPath(query as Record<string, unknown>));
  }, [query]);

  useEffect(() => {
    const y = readCatalogScroll();
    if (!y) return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
      clearCatalogScroll();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (searchDirty.current) return;
    setDraftQ(query.q ?? "");
  }, [query.q]);

  useEffect(() => {
    setMinPrice(query.minPrice?.toString() ?? "");
    setMaxPrice(query.maxPrice?.toString() ?? "");
  }, [query.minPrice, query.maxPrice]);

  useEffect(() => {
    if (!searchDirty.current) return;
    const next = debouncedQ.trim() || undefined;
    if (next === query.q) {
      searchDirty.current = false;
      return;
    }
    setQuery({ q: next });
  }, [debouncedQ, query.q, setQuery]);

  const { data, loading, error, refetch } = useAsyncPage(query, (catalogQuery, signal) =>
    api.vendors.list(catalogQuery, { signal }),
  );

  const featuredTypes = useMemo(
    () => types.filter((type) => type.featured).sort((a, b) => a.sortOrder - b.sortOrder),
    [types],
  );
  const otherTypes = useMemo(
    () => types.filter((type) => !type.featured).sort((a, b) => a.sortOrder - b.sortOrder),
    [types],
  );
  const chipTypes = more ? [...featuredTypes, ...otherTypes] : featuredTypes.length ? featuredTypes : types.slice(0, 6);
  const selectedType = types.find((type) => type.slug === query.category);
  const highlightAttrs = useMemo(
    () =>
      (selectedType?.attributes ?? [])
        .filter((attr) => attr.filterHighlight)
        .sort((a, b) => a.filterSortOrder - b.filterSortOrder),
    [selectedType],
  );
  const studioAttrs = useMemo(
    () =>
      (selectedType?.attributes ?? [])
        .filter((attr) => attr.filterable)
        .sort((a, b) => a.filterSortOrder - b.filterSortOrder || a.key.localeCompare(b.key)),
    [selectedType],
  );

  const items = data?.items ?? [];
  const gridEntries = useMemo(() => {
    type Entry = { kind: "organic" | "sponsored"; vendor: Vendor; promo?: Promotion };
    if (!inlineSlot?.enabled || !sponsoredVendors.length) {
      return items.map((vendor) => ({ kind: "organic" as const, vendor }));
    }
    const sponsoredIds = new Set(sponsoredVendors.map((vendor) => vendor.id));
    const organic = items.filter((vendor) => !sponsoredIds.has(vendor.id));
    const inserts = catalogInlineInsertIndices(
      organic.length,
      inlineSlot.densityEveryN ?? 12,
      inlineSlot.maxPerRequest,
    );
    const queue = sponsoredVendors
      .map((vendor) => ({
        vendor,
        promo: inlinePromos.find((promo) => promo.vendorSlug === vendor.slug),
      }))
      .filter((row) => row.promo);
    const result: Entry[] = organic.map((vendor) => ({ kind: "organic", vendor }));
    for (const index of inserts) {
      const next = queue.shift();
      if (!next) break;
      const at = Math.min(Math.max(index, 0), result.length);
      result.splice(at, 0, { kind: "sponsored", vendor: next.vendor, promo: next.promo });
    }
    return result;
  }, [items, inlineSlot, sponsoredVendors, inlinePromos]);
  const reduceMotion = useReducedMotion();
  const bannerPhoto =
    (query.category && CATEGORY_PHOTOS[query.category]?.replace(/w=\d+/, "w=1800")) ||
    WEDDING_IMAGES[3] ||
    WEDDING_IMAGES[0];

  function compareVendor(vendor: (typeof items)[number]) {
    const result = toggleCompare({
      id: vendor.id,
      slug: vendor.slug,
      name: vendor.name,
      category: vendor.category,
      photoUrl: vendor.photoUrl ?? vendor.photos?.[0],
    });
    setCompareMessage(result.ok ? null : (result.reason ?? null));
  }

  function shortlistVendor(vendor: (typeof items)[number]) {
    api.wedding
      .shortlist({ vendorId: vendor.id })
      .then(() => setSavedIds((current) => new Set(current).add(vendor.id)))
      .catch(() => undefined);
  }
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? query.pageSize;
  const from = total === 0 ? 0 : (query.page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(query.page * pageSize, total);
  const activeFilters = catalogFilterCount(query);
  const facets = data?.facets;
  const attrFacets = facets?.attributes ?? {};

  const cityOptions = useMemo(() => {
    const values = new Map((facets?.cities ?? []).map((city) => [city.value, city.count]));
    if (query.city && !values.has(query.city)) values.set(query.city, 0);
    return [...values.entries()].map(([value, count]) => ({
      value,
      label: count ? `${value} (${count})` : value,
    }));
  }, [facets?.cities, query.city]);
  const districtOptions = useMemo(() => {
    const values = new Map((facets?.districts ?? []).map((district) => [district.value, district.count]));
    if (query.district && !values.has(query.district)) values.set(query.district, 0);
    return [...values.entries()].map(([value, count]) => ({
      value,
      label: count ? `${value} (${count})` : value,
    }));
  }, [facets?.districts, query.district]);

  const patchAttrs = (key: string, next: CatalogAttrValue | undefined) => {
    const attrs = { ...(query.attrs ?? {}) };
    if (next === undefined || (Array.isArray(next) && next.length === 0) || next === "") {
      delete attrs[key];
    } else {
      attrs[key] = next;
    }
    setQuery({ attrs: Object.keys(attrs).length ? attrs : undefined });
  };

  const toggleOption = (key: string, optionKey: string, multi: boolean) => {
    const current = selectedKeys(query.attrs?.[key]);
    if (multi) {
      const next = current.includes(optionKey) ? current.filter((item) => item !== optionKey) : [...current, optionKey];
      patchAttrs(key, next.length ? next : undefined);
      return;
    }
    patchAttrs(key, current.includes(optionKey) ? undefined : optionKey);
  };

  const commitPrice = () => {
    const parsedMin = minPrice.trim() === "" ? undefined : Number(minPrice);
    const parsedMax = maxPrice.trim() === "" ? undefined : Number(maxPrice);
    setQuery({
      minPrice: Number.isFinite(parsedMin) ? parsedMin : undefined,
      maxPrice: Number.isFinite(parsedMax) ? parsedMax : undefined,
    });
  };

  const clearFilters = () => {
    searchDirty.current = false;
    setDraftQ("");
    setMinPrice("");
    setMaxPrice("");
    setQuery({
      q: undefined,
      category: undefined,
      city: undefined,
      district: undefined,
      featured: undefined,
      verified: undefined,
      destination: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      attrs: undefined,
    });
  };

  const clearAttrsOnly = () => setQuery({ attrs: undefined });

  const matchMyWedding = async () => {
    try {
      const wedding = await api.wedding.mine();
      const patch: Partial<typeof query> = {};
      if (wedding.city) patch.city = wedding.city;
      const capacity = selectedType?.attributes?.find(
        (attr) => attr.valueType === "RANGE" && (attr.key === "guestCapacity" || attr.key.includes("guest")),
      );
      if (capacity && wedding.guestCountEstimate) {
        const attrs = { ...(query.attrs ?? {}) };
        attrs[capacity.key] = { min: wedding.guestCountEstimate };
        patch.attrs = attrs;
      }
      setQuery(patch);
    } catch {
      /* ignore */
    }
  };

  const goToPage = (page: number) => {
    setQuery({ page }, { history: "push" });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const emptyFilterHint = useMemo(() => {
    if (!query.attrs || total > 0) return null;
    for (const [key, value] of Object.entries(query.attrs)) {
      const wanted = selectedKeys(value);
      if (!wanted.length) continue;
      const buckets = attrFacets[key] ?? [];
      const def = studioAttrs.find((attr) => attr.key === key);
      const option = def?.options?.find((item) => item.key === wanted[0]);
      const count = buckets.find((bucket) => bucket.value === wanted[0])?.count ?? 0;
      if (count === 0 && option) {
        return {
          key,
          label: localizedText(option.label, locale),
          clear: () => patchAttrs(key, undefined),
        };
      }
    }
    const firstKey = Object.keys(query.attrs)[0];
    if (!firstKey) return null;
    const def = studioAttrs.find((attr) => attr.key === firstKey);
    return {
      key: firstKey,
      label: def?.filterLabel ? localizedText(def.filterLabel, locale) : firstKey,
      clear: () => patchAttrs(firstKey, undefined),
    };
  }, [attrFacets, locale, query.attrs, studioAttrs, total]);

  const sortLabels: Record<VendorSort, string> = {
    featured: t("catalog.sort_featured"),
    rating: t("catalog.sort_rating"),
    price_asc: t("catalog.sort_price_asc"),
    price_desc: t("catalog.sort_price_desc"),
    name: t("catalog.sort_name"),
  };

  const attrFilterStudio = (
    <div className="grid gap-6">
      {studioAttrs.map((attr) => {
        const label = attr.filterLabel ? localizedText(attr.filterLabel, locale) : attr.key;
        const help = attr.filterHelp ? localizedText(attr.filterHelp, locale) : null;
        const multi = attr.valueType === "MULTISELECT";
        const selected = selectedKeys(query.attrs?.[attr.key]);
        return (
          <div key={attr.key} className="grid gap-3">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium">{label}</p>
              <AttributeHelp text={help} />
            </div>
            {attr.valueType === "BOOLEAN" ? (
              <div className="flex flex-wrap gap-2">
                {["true", "false"].map((value) => {
                  const count = attrFacets[attr.key]?.find((bucket) => bucket.value === value)?.count ?? 0;
                  const active = selected.includes(value) || query.attrs?.[attr.key] === value;
                  return (
                    <FilterChip
                      key={value}
                      active={Boolean(active)}
                      onClick={() => patchAttrs(attr.key, active ? undefined : value)}
                    >
                      {value === "true" ? "Yes" : "No"} ({count})
                    </FilterChip>
                  );
                })}
              </div>
            ) : attr.valueType === "RANGE" ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={
                    query.attrs?.[attr.key] &&
                    typeof query.attrs[attr.key] === "object" &&
                    !Array.isArray(query.attrs[attr.key])
                      ? String((query.attrs[attr.key] as { min?: number }).min ?? "")
                      : ""
                  }
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    const min = raw === "" ? undefined : Number(raw);
                    const current =
                      query.attrs?.[attr.key] &&
                      typeof query.attrs[attr.key] === "object" &&
                      !Array.isArray(query.attrs[attr.key])
                        ? (query.attrs[attr.key] as { min?: number; max?: number })
                        : {};
                    patchAttrs(attr.key, {
                      ...current,
                      min: min !== undefined && Number.isFinite(min) ? min : undefined,
                    });
                  }}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={
                    query.attrs?.[attr.key] &&
                    typeof query.attrs[attr.key] === "object" &&
                    !Array.isArray(query.attrs[attr.key])
                      ? String((query.attrs[attr.key] as { max?: number }).max ?? "")
                      : ""
                  }
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    const max = raw === "" ? undefined : Number(raw);
                    const current =
                      query.attrs?.[attr.key] &&
                      typeof query.attrs[attr.key] === "object" &&
                      !Array.isArray(query.attrs[attr.key])
                        ? (query.attrs[attr.key] as { min?: number; max?: number })
                        : {};
                    patchAttrs(attr.key, {
                      ...current,
                      max: max !== undefined && Number.isFinite(max) ? max : undefined,
                    });
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                {(attr.options ?? []).map((option) => {
                  const count = attrFacets[attr.key]?.find((bucket) => bucket.value === option.key)?.count ?? 0;
                  const active = selected.includes(option.key);
                  return (
                    <ChoiceCard
                      key={option.key}
                      title={localizedText(option.label, locale)}
                      helpText={option.helpText ? localizedText(option.helpText, locale) : null}
                      selected={active}
                      multi={multi}
                      count={count}
                      disabled={count === 0 && !active}
                      onSelect={() => toggleOption(attr.key, option.key, multi)}
                      className="min-h-0"
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={compareItems.length ? "cw-stack pb-28" : "cw-stack"}>
      <header className="relative isolate overflow-hidden rounded-3xl bg-ink">
        <AnimatePresence initial={false}>
          <motion.img
            key={bannerPhoto}
            src={bannerPhoto}
            alt=""
            aria-hidden
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 -z-10 size-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20" />
        <div className="flex flex-col gap-6 px-6 py-10 sm:px-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2 text-paper">
            <p className="text-label font-medium tracking-eyebrow text-paper/70 uppercase">{t("catalog.kicker")}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={selectedType?.slug ?? "all"}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="font-serif text-4xl font-medium tracking-tight sm:text-6xl"
              >
                {selectedType ? typeLabel(selectedType, selectedType.slug, locale) : t("nav.catalog")}
              </motion.h1>
            </AnimatePresence>
            <p className="text-sm leading-relaxed text-paper/80 sm:text-h4">
              {selectedType
                ? `${total} ${typeLabel(selectedType, selectedType.slug, locale).toLowerCase()} across Sri Lanka`
                : t("catalog.subtitle")}
            </p>
          </div>
          <AsyncSearchField
            className="w-full rounded-full bg-card shadow-raised lg:max-w-md"
            placeholder={t("knotly.searchCatalog")}
            value={draftQ}
            onChange={(value) => {
              searchDirty.current = true;
              setDraftQ(value);
            }}
          />
        </div>
      </header>

      <LayoutGroup id="catalog-categories">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { slug: undefined as string | undefined, label: t("knotly.viewAll") },
            ...chipTypes.map((type) => ({
              slug: type.slug as string | undefined,
              label: typeLabel(type, type.slug, locale),
            })),
          ].map(({ slug, label }) => {
            const active = slug ? query.category === slug : !query.category;
            const ChipIcon = slug ? (CATEGORY_ICONS[slug] ?? Sparkles) : LayoutGrid;
            return (
              <motion.button
                key={slug ?? "all"}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                onClick={() =>
                  setQuery({ category: slug && query.category !== slug ? slug : undefined, attrs: undefined })
                }
                className={cn(
                  "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-transparent text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="catalog-chip-active"
                    className="absolute inset-0 -z-0 rounded-full bg-primary shadow-md"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <ChipIcon className="relative size-4" />
                <span className="relative">{label}</span>
              </motion.button>
            );
          })}
          {otherTypes.length && featuredTypes.length ? (
            <FilterChip active={more} onClick={() => setMore((value) => !value)}>
              {t("knotly.more")}
            </FilterChip>
          ) : null}
          {canShortlist ? (
            <FilterChip active={false} onClick={() => void matchMyWedding()}>
              <Icon icon={Heart} size="xs" />
              Match my wedding
            </FilterChip>
          ) : null}
        </div>
      </LayoutGroup>

      {!inlineSlot?.enabled ? (
        <PromotionSlotRail slot="CATALOG_TOP" category={query.category} city={query.city} limit={1} layout="STRIP" />
      ) : null}

      <SponsoredPromoStrip
        slot="CATALOG_DATE_AVAILABLE"
        eyebrow="Available on your date · Sponsored"
        title="Vendors free around your wedding week"
        category={query.category}
        city={query.city}
        limit={4}
      />

      {query.category && highlightAttrs.length ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card/70 p-4 shadow-card sm:p-5"
        >
          <div className="grid gap-4">
            {highlightAttrs.map((attr) => {
              const label = attr.filterLabel ? localizedText(attr.filterLabel, locale) : attr.key;
              const help = attr.filterHelp ? localizedText(attr.filterHelp, locale) : null;
              const multi = attr.valueType === "MULTISELECT";
              const selected = selectedKeys(query.attrs?.[attr.key]);
              return (
                <div key={attr.key} className="grid gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-label font-medium tracking-spaced text-muted-foreground uppercase">{label}</p>
                    <AttributeHelp text={help} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(attr.options ?? []).map((option) => {
                      const count = attrFacets[attr.key]?.find((bucket) => bucket.value === option.key)?.count ?? 0;
                      const active = selected.includes(option.key);
                      return (
                        <FilterChip
                          key={option.key}
                          active={active}
                          onClick={() => {
                            if (count === 0 && !active) return;
                            toggleOption(attr.key, option.key, multi);
                          }}
                        >
                          {localizedText(option.label, locale)}
                          <span className="text-label opacity-70">{count}</span>
                        </FilterChip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      <div ref={resultsRef} className="sticky top-20 z-30 scroll-mt-24">
        <AsyncListToolbar
          className="border-border bg-background/80 shadow-card backdrop-blur-xl"
          summary={loading || !data ? t("catalog.loading") : t("catalog.results", { from, to, total })}
        >
          <FloatingPanel open={filtersOpen} onOpenChange={setFiltersOpen}>
            <FloatingPanelTrigger asChild>
              <Button type="button" shape="pill" size="sm" variant={activeFilters ? "default" : "outline"}>
                <Icon icon={SlidersHorizontal} size="sm" />
                {t("catalog.filters")}
                {activeFilters ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary-foreground text-xs text-primary">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
            </FloatingPanelTrigger>
            <FloatingPanelContent side="right" width="26rem">
              <FloatingPanelHeader
                icon={SlidersHorizontal}
                title={t("catalog.filters")}
                actions={
                  activeFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {t("catalog.clear")}
                    </button>
                  ) : null
                }
              />
              <FloatingPanelBody className="gap-7">
                <FloatingPanelSection title={t("catalog.filterLocation")}>
                  <div className="grid gap-2">
                    <Label>{t("catalog.city")}</Label>
                    <Combobox
                      aria-label={t("catalog.city")}
                      value={query.city ?? "any"}
                      onValueChange={(value) => setQuery({ city: value === "any" ? undefined : value })}
                      options={[{ value: "any", label: t("catalog.anyCity") }, ...cityOptions]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("catalog.district")}</Label>
                    <Combobox
                      aria-label={t("catalog.district")}
                      value={query.district ?? "any"}
                      onValueChange={(value) => setQuery({ district: value === "any" ? undefined : value })}
                      options={[{ value: "any", label: t("catalog.anyDistrict") }, ...districtOptions]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("catalog.minRating")}</Label>
                    <SimpleSelect
                      value={query.minRating?.toString() ?? "any"}
                      onValueChange={(value) => setQuery({ minRating: value === "any" ? undefined : Number(value) })}
                      options={[
                        { value: "any", label: t("catalog.anyRating") },
                        { value: "4", label: t("catalog.rating4") },
                        { value: "4.5", label: t("catalog.rating45") },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="catalog-min-price">{t("catalog.minPrice")}</Label>
                      <Input
                        id="catalog-min-price"
                        inputMode="numeric"
                        value={minPrice}
                        onChange={(event) => setMinPrice(event.target.value)}
                        onBlur={commitPrice}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitPrice();
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="catalog-max-price">{t("catalog.maxPrice")}</Label>
                      <Input
                        id="catalog-max-price"
                        inputMode="numeric"
                        value={maxPrice}
                        onChange={(event) => setMaxPrice(event.target.value)}
                        onBlur={commitPrice}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitPrice();
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={query.featured === true}
                      onClick={() => setQuery({ featured: query.featured ? undefined : true })}
                    >
                      {t("catalog.featuredOnly")}
                    </FilterChip>
                    <FilterChip
                      active={query.verified === true}
                      onClick={() => setQuery({ verified: query.verified ? undefined : true })}
                    >
                      {t("catalog.verifiedOnly")}
                    </FilterChip>
                    <FilterChip
                      active={query.destination === true}
                      onClick={() => setQuery({ destination: query.destination ? undefined : true })}
                    >
                      {t("catalog.destination")}
                    </FilterChip>
                  </div>
                </FloatingPanelSection>

                <FloatingPanelSection title={t("catalog.filterAttributes")}>
                  {query.category && studioAttrs.length ? (
                    attrFilterStudio
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("catalog.pickTypeForAttrs")}</p>
                  )}
                </FloatingPanelSection>
              </FloatingPanelBody>
              <FloatingPanelFooter>
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl text-base"
                  onClick={() => setFiltersOpen(false)}
                >
                  {t("catalog.showResults", { total })}
                </Button>
              </FloatingPanelFooter>
            </FloatingPanelContent>
          </FloatingPanel>
          <AsyncSortSelect
            label={t("catalog.sort")}
            value={query.sort}
            onChange={(value) => setQuery({ sort: value as VendorSort })}
            options={SORT_KEYS.map((value) => ({
              value,
              label: sortLabels[value],
            }))}
          />
          <div className="flex rounded-full border border-border bg-card p-0.5">
            <Button
              type="button"
              size="sm"
              shape="pill"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="h-8 gap-1.5 px-3"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">{t("knotly.gridView")}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              shape="pill"
              variant={view === "map" ? "secondary" : "ghost"}
              className="h-8 gap-1.5 px-3"
              onClick={() => setView("map")}
            >
              <MapIcon className="size-3.5" />
              <span className="hidden sm:inline">{t("knotly.mapView")}</span>
            </Button>
          </div>
          {data && data.pageCount > 1 ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                shape="pill"
                variant="outline"
                className="size-8"
                disabled={query.page <= 1}
                aria-label={t("catalog.prev")}
                onClick={() => goToPage(query.page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-14 text-center text-xs text-muted-foreground">
                {query.page} / {data.pageCount}
              </span>
              <Button
                type="button"
                size="icon"
                shape="pill"
                variant="outline"
                className="size-8"
                disabled={query.page >= data.pageCount}
                aria-label={t("catalog.next")}
                onClick={() => goToPage(query.page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </AsyncListToolbar>
      </div>

      {activeFilters || query.q || query.attrs ? (
        <motion.div
          layout
          className="flex flex-wrap items-center gap-2 [&>*]:motion-safe:animate-in [&>*]:motion-safe:fade-in-0 [&>*]:motion-safe:zoom-in-95"
        >
          {query.q ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => {
                searchDirty.current = false;
                setDraftQ("");
                setQuery({ q: undefined });
              }}
            >
              “{query.q}”
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.category ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => setQuery({ category: undefined, attrs: undefined })}
            >
              {typeLabel(selectedType, query.category, locale)}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.city ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => setQuery({ city: undefined })}
            >
              {query.city}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.district ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => setQuery({ district: undefined })}
            >
              {query.district}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.featured ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => setQuery({ featured: undefined })}
            >
              {t("catalog.featuredOnly")}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.verified ? (
            <Button
              type="button"
              shape="pill"
              size="sm"
              variant="secondary"
              onClick={() => setQuery({ verified: undefined })}
            >
              {t("catalog.verifiedOnly")}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {Object.entries(query.attrs ?? {}).flatMap(([key, value]) => {
            const def = studioAttrs.find((attr) => attr.key === key);
            const keys = selectedKeys(value);
            if (value && typeof value === "object" && !Array.isArray(value) && ("min" in value || "max" in value)) {
              const range = value as { min?: number; max?: number };
              const label = [
                def?.filterLabel ? localizedText(def.filterLabel, locale) : key,
                range.min !== undefined ? `${range.min}+` : null,
                range.max !== undefined ? `≤${range.max}` : null,
              ]
                .filter(Boolean)
                .join(" ");
              return [
                <Button
                  key={key}
                  type="button"
                  shape="pill"
                  size="sm"
                  variant="secondary"
                  onClick={() => patchAttrs(key, undefined)}
                >
                  {label}
                  <Icon icon={X} size="xs" />
                </Button>,
              ];
            }
            return keys.map((optionKey) => {
              const option = def?.options?.find((item) => item.key === optionKey);
              return (
                <Button
                  key={`${key}-${optionKey}`}
                  type="button"
                  shape="pill"
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleOption(key, optionKey, def?.valueType === "MULTISELECT")}
                >
                  {option ? localizedText(option.label, locale) : optionKey}
                  <Icon icon={X} size="xs" />
                </Button>
              );
            });
          })}
          {activeFilters ? (
            <Button type="button" shape="pill" size="sm" variant="ghost" onClick={clearFilters}>
              {t("catalog.clear")}
            </Button>
          ) : null}
          {query.attrs && Object.keys(query.attrs).length ? (
            <Button type="button" shape="pill" size="sm" variant="ghost" onClick={clearAttrsOnly}>
              Clear attribute filters
            </Button>
          ) : null}
        </motion.div>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p>{error}</p>
          <Button type="button" shape="pill" size="sm" onClick={refetch}>
            {t("catalog.retry")}
          </Button>
        </div>
      ) : null}

      {view === "map" ? (
        <Stagger key={`map-${query.page}-${query.category ?? ""}`} className="grid gap-5 lg:grid-cols-2" stagger={0.06}>
          {(facets?.districts ?? []).map((district, districtIndex) => {
            const inDistrict = items.filter((vendor) => vendor.district === district.value);
            if (!inDistrict.length) return null;
            const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${district.value}, Sri Lanka wedding venues`)}`;
            const cover =
              inDistrict[0]?.photoUrl ??
              inDistrict[0]?.photos?.[0] ??
              WEDDING_IMAGES[districtIndex % WEDDING_IMAGES.length];
            return (
              <StaggerItem key={district.value} className="h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                  <div className="group relative h-36 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-paper">
                      <div>
                        <p className="flex items-center gap-1.5 font-serif text-2xl">
                          <MapPin className="size-5" /> {district.value}
                        </p>
                        <p className="text-xs text-paper/80">{district.count} listings in catalog</p>
                      </div>
                      <a
                        href={maps}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur transition hover:bg-paper"
                      >
                        <MapIcon className="size-3.5" /> {t("knotly.openAreaMap")}
                      </a>
                    </div>
                  </div>
                  <div className="grid gap-1 p-2">
                    {inDistrict.length ? (
                      inDistrict.map((vendor) => {
                        const thumb = vendor.photoUrl ?? vendor.photos?.[0];
                        const mapSponsored = sponsoredVendors.some((row) => row.id === vendor.id);
                        return (
                          <div
                            key={vendor.id}
                            className={cn(
                              "group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/60",
                              mapSponsored && "ring-1 ring-warning/60 bg-warning-subtle/40",
                            )}
                          >
                            <Link
                              href={`/vendors/${vendor.slug}`}
                              onClick={() => {
                                const promo = inlinePromos.find((row) => row.vendorSlug === vendor.slug);
                                if (promo) void api.promotions.click(promo.id, { slot: "CATALOG_MAP" });
                                markLeavingCatalog();
                              }}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <VendorThumb src={thumb} name={vendor.name} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium group-hover:text-primary">
                                  {mapSponsored ? "★ " : ""}
                                  {vendor.name}
                                  {mapSponsored ? (
                                    <span className="ml-2 text-label font-medium uppercase tracking-wide text-warning-fg">
                                      Sponsored
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                  <span>{vendor.city}</span>
                                  {vendor.ratingAvg ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Star className="size-3 fill-primary text-primary" />{" "}
                                      {vendor.ratingAvg.toFixed(1)}
                                    </span>
                                  ) : null}
                                  <span className="text-foreground">
                                    {priceLabel(
                                      vendor.startingPriceLkr,
                                      currency,
                                      vendor.priceDisplayMode,
                                      vendor.showPricing,
                                      t("knotly.inquirePricing"),
                                    )}
                                  </span>
                                </span>
                              </span>
                            </Link>
                            <button
                              type="button"
                              aria-label={`Quick view ${vendor.name}`}
                              onClick={() => setQuickId(vendor.id)}
                              className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                            >
                              <Eye className="size-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-3 py-4 text-sm text-muted-foreground">
                        No vendors from {district.value} on this page.
                      </p>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <AsyncListGrid
          loading={loading}
          resetKey={`${query.page}-${query.sort}-${query.q ?? ""}-${query.category ?? ""}-${JSON.stringify(query.attrs ?? {})}`}
          empty={
            <EmptyState
              icon={Search}
              title={t("catalog.emptyTitle")}
              description={
                emptyFilterHint
                  ? `No matches with “${emptyFilterHint.label}”. Try removing that filter.`
                  : t("catalog.resultsEmpty")
              }
              action={
                emptyFilterHint ? (
                  <Button type="button" shape="pill" onClick={emptyFilterHint.clear}>
                    Remove {emptyFilterHint.label}
                  </Button>
                ) : activeFilters || query.q ? (
                  <Button type="button" shape="pill" onClick={clearFilters}>
                    {t("catalog.clear")}
                  </Button>
                ) : null
              }
            />
          }
        >
          {gridEntries.map((entry) => (
            <VendorCard
              key={`${entry.kind}-${entry.vendor.id}`}
              href={`/vendors/${entry.vendor.slug}`}
              linkAs={Link}
              onNavigate={() => {
                if (entry.kind === "sponsored" && entry.promo) {
                  void api.promotions.click(entry.promo.id, { slot: "CATALOG_INLINE" });
                }
                markLeavingCatalog();
              }}
              name={entry.vendor.name}
              category={typeLabel(
                types.find((type) => type.slug === entry.vendor.category),
                entry.vendor.category,
                locale,
              )}
              location={`${entry.vendor.city}, ${entry.vendor.district}`}
              priceBand={priceLabel(
                entry.vendor.startingPriceLkr,
                currency,
                entry.vendor.priceDisplayMode,
                entry.vendor.showPricing,
                t("knotly.inquirePricing"),
              )}
              rating={entry.vendor.ratingAvg}
              ratingCount={entry.vendor.ratingCount}
              imageSrc={entry.vendor.photoUrl}
              photos={entry.vendor.photos}
              verified={entry.vendor.verified}
              featured={entry.kind === "organic" ? entry.vendor.featured : false}
              sponsored={entry.kind === "sponsored"}
              matchChips={matchChipsForVendor(entry.vendor, query.attrs, locale)}
              shortlisted={savedIds.has(entry.vendor.id)}
              compared={hasCompare(entry.vendor.slug)}
              onQuickView={() => setQuickId(entry.vendor.id)}
              onCompare={() => compareVendor(entry.vendor)}
              onShortlist={canShortlist ? () => shortlistVendor(entry.vendor) : undefined}
            />
          ))}
        </AsyncListGrid>
      )}

      <motion.button
        type="button"
        onClick={() => setFiltersOpen(true)}
        initial={reduceMotion ? false : { y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 26 }}
        className={cn(
          "fixed left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-raised md:hidden",
          compareItems.length ? "bottom-24" : "bottom-5",
        )}
      >
        <SlidersHorizontal className="size-4" />
        {t("catalog.filters")}
        {activeFilters ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
            {activeFilters}
          </span>
        ) : null}
      </motion.button>

      {(() => {
        const quick = items.find((vendor) => vendor.id === quickId) ?? null;
        return (
          <VendorQuickView
            open={Boolean(quick)}
            onOpenChange={(open) => !open && setQuickId(null)}
            linkAs={Link}
            onNavigate={markLeavingCatalog}
            vendor={
              quick
                ? toQuickView(
                    quick,
                    typeLabel(
                      types.find((type) => type.slug === quick.category),
                      quick.category,
                      locale,
                    ),
                    priceLabel(
                      quick.startingPriceLkr,
                      currency,
                      quick.priceDisplayMode,
                      quick.showPricing,
                      t("knotly.inquirePricing"),
                    ),
                  )
                : null
            }
            shortlisted={quick ? savedIds.has(quick.id) : false}
            onShortlist={quick && canShortlist ? () => shortlistVendor(quick) : undefined}
            compared={quick ? hasCompare(quick.slug) : false}
            onCompare={quick ? () => compareVendor(quick) : undefined}
          />
        );
      })()}

      {data && data.pageCount > 1 ? (
        <PaginationBar
          page={query.page}
          pageCount={data.pageCount}
          hasPrev={query.page > 1}
          hasNext={query.page < data.pageCount}
          onPage={goToPage}
          previousLabel={t("catalog.prev")}
          nextLabel={t("catalog.next")}
        />
      ) : null}

      <VendorCompareDock
        items={compareItems}
        message={compareMessage}
        onRemove={(slug) => {
          removeCompare(slug);
          setCompareMessage(null);
        }}
        onClear={() => {
          clearCompare();
          setCompareMessage(null);
        }}
        onCompare={() => {
          if (compareItems.length < 2) return;
          router.push(`/vendors/compare?slugs=${compareItems.map((item) => item.slug).join(",")}`);
        }}
      />
    </div>
  );
}
