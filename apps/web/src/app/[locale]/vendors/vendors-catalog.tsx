"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname as useNextPathname, useRouter as useNextRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
  toSearchParams,
  vendorCatalogQuerySchema,
  VENDOR_CATALOG_DEFAULTS,
  type CatalogAttrs,
  type CatalogAttrValue,
  type PublicVendorTypeListItem,
  type Vendor,
  type VendorSort,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@ceylonweddings/ui/components/sheet";
import { VendorCard } from "@ceylonweddings/ui/domain/vendor-card";
import { VendorCompareDock } from "@ceylonweddings/ui/domain/vendor-compare-dock";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { AttributeHelp } from "@ceylonweddings/ui/domain/attribute-help";
import { ChoiceCard } from "@ceylonweddings/ui/domain/choice-card";
import {
  AsyncListGrid,
  AsyncListToolbar,
  AsyncSearchField,
  AsyncSortSelect,
  CategoryPills,
  FilterChip,
  PaginationBar,
  VendorCardSkeleton,
} from "@ceylonweddings/ui/domain/async-list";
import { Link, useRouter } from "../../../i18n/navigation";
import { PromotionSlotRail } from "../../../components/promotion-slot-rail";
import { CATEGORY_LABELS, localizedText, priceLabel } from "../../../lib/labels";

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
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <VendorCardSkeleton key={index} />
        ))}
      </div>
    </div>
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
    api.vendorTypes().then(setTypes).catch(() => setTypes([]));
  }, []);

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
      const next = current.includes(optionKey)
        ? current.filter((item) => item !== optionKey)
        : [...current, optionKey];
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
                  const active = selected.includes(value) || (query.attrs?.[attr.key] === value);
                  return (
                    <FilterChip
                      key={value}
                      active={Boolean(active)}
                      onClick={() =>
                        patchAttrs(attr.key, active ? undefined : value)
                      }
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
      <PromotionSlotRail slot="CATALOG_TOP" category={query.category} limit={1} />

      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {t("catalog.kicker")}
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{t("nav.catalog")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {selectedType
              ? `${total} ${typeLabel(selectedType, selectedType.slug, locale).toLowerCase()}`
              : t("catalog.subtitle")}
          </p>
        </div>
        <AsyncSearchField
          className="w-full lg:max-w-md"
          placeholder={t("knotly.searchCatalog")}
          value={draftQ}
          onChange={(value) => {
            searchDirty.current = true;
            setDraftQ(value);
          }}
        />
      </header>

      <CategoryPills>
        <FilterChip
          active={!query.category}
          onClick={() => setQuery({ category: undefined, attrs: undefined })}
        >
          {t("knotly.viewAll")}
        </FilterChip>
        {chipTypes.map((type) => (
          <FilterChip
            key={type.slug}
            active={query.category === type.slug}
            onClick={() =>
              setQuery({
                category: query.category === type.slug ? undefined : type.slug,
                attrs: undefined,
              })
            }
          >
            {typeLabel(type, type.slug, locale)}
          </FilterChip>
        ))}
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
      </CategoryPills>

      {!query.category ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
          {t("catalog.pickTypeForAttrs")}
        </div>
      ) : null}

      {query.category && highlightAttrs.length ? (
        <div className="sticky top-16 z-20 -mx-1 border-b border-border/60 bg-background/90 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="grid gap-4">
            {highlightAttrs.map((attr) => {
              const label = attr.filterLabel ? localizedText(attr.filterLabel, locale) : attr.key;
              const help = attr.filterHelp ? localizedText(attr.filterHelp, locale) : null;
              const multi = attr.valueType === "MULTISELECT";
              const selected = selectedKeys(query.attrs?.[attr.key]);
              return (
                <div key={attr.key} className="grid gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      {label}
                    </p>
                    <AttributeHelp text={help} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(attr.options ?? []).map((option) => {
                      const count =
                        attrFacets[attr.key]?.find((bucket) => bucket.value === option.key)?.count ?? 0;
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
                          <span className="text-[10px] opacity-70">{count}</span>
                        </FilterChip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={resultsRef} className="scroll-mt-24">
        <AsyncListToolbar
          summary={loading || !data ? t("catalog.loading") : t("catalog.results", { from, to, total })}
        >
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button type="button" shape="pill" size="sm" variant={activeFilters ? "default" : "outline"}>
                <Icon icon={SlidersHorizontal} size="sm" />
                {t("catalog.filters")}
                {activeFilters ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary-foreground text-xs text-primary">
                    {activeFilters}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(24rem,92vw)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("catalog.filters")}</SheetTitle>
              </SheetHeader>
              <div className="grid gap-8 p-5 pt-2">
                <div className="grid gap-4">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {t("catalog.filterLocation")}
                  </p>
                  <div className="grid gap-2">
                    <Label>{t("catalog.city")}</Label>
                    <SimpleSelect
                      value={query.city ?? "any"}
                      onValueChange={(value) => setQuery({ city: value === "any" ? undefined : value })}
                      options={[{ value: "any", label: t("catalog.anyCity") }, ...cityOptions]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("catalog.district")}</Label>
                    <SimpleSelect
                      value={query.district ?? "any"}
                      onValueChange={(value) => setQuery({ district: value === "any" ? undefined : value })}
                      options={[{ value: "any", label: t("catalog.anyDistrict") }, ...districtOptions]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("catalog.minRating")}</Label>
                    <SimpleSelect
                      value={query.minRating?.toString() ?? "any"}
                      onValueChange={(value) =>
                        setQuery({ minRating: value === "any" ? undefined : Number(value) })
                      }
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
                </div>

                <div className="grid gap-4">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {t("catalog.filterAttributes")}
                  </p>
                  {query.category && studioAttrs.length ? (
                    attrFilterStudio
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("catalog.pickTypeForAttrs")}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Button type="button" onClick={() => setFiltersOpen(false)}>
                    {t("catalog.showResults", { total })}
                  </Button>
                  {activeFilters ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        clearFilters();
                        setFiltersOpen(false);
                      }}
                    >
                      {t("catalog.clear")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
        <div className="flex flex-wrap gap-2">
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
            <Button type="button" shape="pill" size="sm" variant="secondary" onClick={() => setQuery({ city: undefined })}>
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
            <Button type="button" shape="pill" size="sm" variant="secondary" onClick={() => setQuery({ featured: undefined })}>
              {t("catalog.featuredOnly")}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {query.verified ? (
            <Button type="button" shape="pill" size="sm" variant="secondary" onClick={() => setQuery({ verified: undefined })}>
              {t("catalog.verifiedOnly")}
              <Icon icon={X} size="xs" />
            </Button>
          ) : null}
          {Object.entries(query.attrs ?? {}).flatMap(([key, value]) => {
            const def = studioAttrs.find((attr) => attr.key === key);
            const keys = selectedKeys(value);
            if (
              value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              ("min" in value || "max" in value)
            ) {
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
        </div>
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
        <div className="grid gap-4">
          {(facets?.districts ?? []).map((district) => {
            const inDistrict = items.filter((vendor) => vendor.district === district.value);
            if (!inDistrict.length && query.district && query.district !== district.value) return null;
            const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${district.value}, Sri Lanka wedding venues`)}`;
            return (
              <div key={district.value} className="grid gap-3 rounded-3xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-serif text-xl">{district.value}</p>
                    <p className="text-xs text-muted-foreground">{district.count} listings in catalog</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={maps} target="_blank" rel="noreferrer">
                      {t("knotly.openAreaMap")}
                    </a>
                  </Button>
                </div>
                <div className="grid gap-2">
                  {(inDistrict.length ? inDistrict : items.filter((v) => v.district === district.value)).map(
                    (vendor) => (
                      <Link
                        key={vendor.id}
                        href={`/vendors/${vendor.slug}`}
                        onClick={() => markLeavingCatalog()}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/40 px-3 py-2 text-sm transition hover:bg-secondary"
                      >
                        <span className="truncate font-medium">{vendor.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {vendor.city} · {priceLabel(vendor.startingPriceLkr, currency, vendor.priceDisplayMode, vendor.showPricing, t("knotly.inquirePricing"))}
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
          {items.map((vendor) => (
            <VendorCard
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              linkAs={Link}
              onNavigate={markLeavingCatalog}
              name={vendor.name}
              category={
                typeLabel(
                  types.find((type) => type.slug === vendor.category),
                  vendor.category,
                  locale,
                )
              }
              location={`${vendor.city}, ${vendor.district}`}
              priceBand={priceLabel(vendor.startingPriceLkr, currency, vendor.priceDisplayMode, vendor.showPricing, t("knotly.inquirePricing"))}
              rating={vendor.ratingAvg}
              ratingCount={vendor.ratingCount}
              imageSrc={vendor.photoUrl}
              photos={vendor.photos}
              verified={vendor.verified}
              featured={vendor.featured}
              matchChips={matchChipsForVendor(vendor, query.attrs, locale)}
              shortlisted={savedIds.has(vendor.id)}
              compared={hasCompare(vendor.slug)}
              onCompare={() => {
                const result = toggleCompare({
                  id: vendor.id,
                  slug: vendor.slug,
                  name: vendor.name,
                  category: vendor.category,
                  photoUrl: vendor.photoUrl ?? vendor.photos?.[0],
                });
                setCompareMessage(result.ok ? null : (result.reason ?? null));
              }}
              onShortlist={
                canShortlist
                  ? () => {
                      api.wedding
                        .shortlist({ vendorId: vendor.id })
                        .then(() => setSavedIds((current) => new Set(current).add(vendor.id)))
                        .catch(() => undefined);
                    }
                  : undefined
              }
            />
          ))}
        </AsyncListGrid>
      )}

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
