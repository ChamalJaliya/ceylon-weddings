"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Package, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type {
  Promotion,
  PromotionBillingInterval,
  PromotionDisclosure,
  PromotionLayout,
  PromotionPackage,
  PromotionSlotConfig,
  UpsertPromotionPackageBody,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { Switch } from "@ceylonweddings/ui/components/switch";
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelContent,
  FloatingPanelFooter,
  FloatingPanelHeader,
} from "@ceylonweddings/ui/domain/floating-panel";
import {
  LAYOUT_META,
  PROMOTION_LAYOUTS,
  PROMOTION_SLOTS,
  PromotionPerf,
  SLOT_META,
} from "@ceylonweddings/ui/domain/ads-studio";
import { ConfirmDialog } from "@ceylonweddings/ui/components/confirm-dialog";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { Link } from "@/i18n/navigation";

const DISCLOSURES: PromotionDisclosure[] = ["SPONSORED", "SPONSORED_STORY", "CUSTOM"];
const INTERVALS: PromotionBillingInterval[] = ["DAY", "WEEK", "MONTH"];

const DISCLOSURE_LABEL: Record<PromotionDisclosure, string> = {
  SPONSORED: "Sponsored",
  SPONSORED_STORY: "Sponsored story",
  CUSTOM: "Custom badge",
};
const INTERVAL_LABEL: Record<PromotionBillingInterval, string> = { DAY: "Day", WEEK: "Week", MONTH: "Month" };

const SLOT_COLUMNS = ["slot", "delivery", "perf", "live", "actions"] as const;
const PKG_COLUMNS = ["name", "slots", "price", "runs", "status", "actions"] as const;

function money(amount: number, interval?: string) {
  return `LKR ${amount.toLocaleString("en-LK")}${interval ? ` / ${interval.toLowerCase()}` : ""}`;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AdminAdsPlacementsPage() {
  const [tab, setTab] = useState<"slots" | "packages">("slots");
  const [slots, setSlots] = useState<PromotionSlotConfig[]>([]);
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [analytics, setAnalytics] = useState<Array<{ slot: string; impressions: number; clicks: number }>>([]);
  const [draft, setDraft] = useState<PromotionSlotConfig | null>(null);
  const [preview, setPreview] = useState<Promotion[]>([]);
  const [pkgDraft, setPkgDraft] = useState<UpsertPromotionPackageBody | null>(null);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [liveFilter, setLiveFilter] = useState("all");
  const [pkgQuery, setPkgQuery] = useState("");
  const [pkgStatus, setPkgStatus] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<PromotionPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [slotRows, pkgRows, stats] = await Promise.all([
        api.admin.promotionSlots(),
        api.admin.promotionPackages(),
        api.admin.promotionSlotAnalytics().catch(() => []),
      ]);
      setSlots(slotRows);
      setPackages(pkgRows);
      setAnalytics(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load placements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const analyticsBySlot = useMemo(() => new Map(analytics.map((row) => [row.slot, row])), [analytics]);

  const pageOptions = useMemo(
    () =>
      [...new Set(slots.map((row) => row.pageKey))]
        .sort()
        .map((page) => ({ value: page, label: page.replace(/\b\w/g, (c) => c.toUpperCase()) })),
    [slots],
  );

  const visibleSlots = useMemo(() => {
    const q = query.trim().toLowerCase();
    return slots.filter((row) => {
      if (pageFilter !== "all" && row.pageKey !== pageFilter) return false;
      if (liveFilter === "on" && !row.enabled) return false;
      if (liveFilter === "off" && row.enabled) return false;
      if (!q) return true;
      return [SLOT_META[row.slot]?.label, row.pageKey, row.regionKey, row.description]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q));
    });
  }, [slots, query, pageFilter, liveFilter]);

  const visiblePackages = useMemo(() => {
    const q = pkgQuery.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (pkgStatus === "active" && !pkg.active) return false;
      if (pkgStatus === "hidden" && pkg.active) return false;
      if (!q) return true;
      return [pkg.name, pkg.slug, pkg.description].filter(Boolean).some((t) => String(t).toLowerCase().includes(q));
    });
  }, [packages, pkgQuery, pkgStatus]);

  const slotPager = useClientTablePagination(visibleSlots, 25, `${query}|${pageFilter}|${liveFilter}`);
  const pkgPager = useClientTablePagination(visiblePackages, 25, `${pkgQuery}|${pkgStatus}`);
  const slotChrome = showListChrome(
    getListEmptyMode({ sourceCount: slots.length, filteredCount: visibleSlots.length }),
    loading,
  );
  const pkgChrome = showListChrome(
    getListEmptyMode({ sourceCount: packages.length, filteredCount: visiblePackages.length }),
    loading,
  );

  function clearSlotFilters() {
    setQuery("");
    setPageFilter("all");
    setLiveFilter("all");
  }

  function editPackage(pkg: PromotionPackage) {
    setEditingPkgId(pkg.id);
    setPkgDraft({
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      slots: pkg.slots,
      priceLkr: pkg.priceLkr,
      interval: pkg.interval,
      durationDays: pkg.durationDays,
      active: pkg.active,
      sortOrder: pkg.sortOrder,
      stripePriceId: pkg.stripePriceId,
    });
  }

  function openSlot(row: PromotionSlotConfig) {
    setDraft(row);
    setPreview([]);
    if (row.enabled) {
      void api.promotions
        .public({ slot: row.slot, limit: row.maxPerRequest })
        .then(setPreview)
        .catch(() => setPreview([]));
    }
  }

  function slotBody(row: PromotionSlotConfig) {
    return {
      slot: row.slot,
      enabled: row.enabled,
      pageKey: row.pageKey,
      regionKey: row.regionKey,
      description: row.description,
      defaultLayout: row.defaultLayout,
      maxPerRequest: row.maxPerRequest,
      densityEveryN: row.densityEveryN,
      disclosure: row.disclosure,
      priceLkr: row.priceLkr,
      interval: row.interval,
      currency: row.currency,
      sortOrder: row.sortOrder,
      notes: row.notes,
    };
  }

  async function saveSlot() {
    if (!draft) return;
    try {
      setSaving(true);
      setNotice(null);
      await api.admin.upsertPromotionSlot(slotBody(draft));
      setNotice(`${SLOT_META[draft.slot]?.label ?? draft.slot} saved`);
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save placement");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSlot(row: PromotionSlotConfig, enabled: boolean) {
    setSlots((prev) => prev.map((item) => (item.slot === row.slot ? { ...item, enabled } : item)));
    try {
      await api.admin.upsertPromotionSlot(slotBody({ ...row, enabled }));
    } catch (err) {
      setSlots((prev) => prev.map((item) => (item.slot === row.slot ? { ...item, enabled: !enabled } : item)));
      setError(err instanceof Error ? err.message : "Could not update placement");
    }
  }

  async function savePackage() {
    if (!pkgDraft) return;
    try {
      setSaving(true);
      setNotice(null);
      if (editingPkgId) {
        await api.admin.updatePromotionPackage(editingPkgId, pkgDraft);
      } else {
        await api.admin.createPromotionPackage(pkgDraft);
      }
      setPkgDraft(null);
      setEditingPkgId(null);
      setNotice("Package saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save package");
    } finally {
      setSaving(false);
    }
  }

  async function removePackage(id: string) {
    try {
      await api.admin.deletePromotionPackage(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete package");
    }
  }

  function newPackage() {
    setEditingPkgId(null);
    setPkgDraft({
      name: "",
      slug: `package-${Date.now().toString(36)}`,
      description: "",
      slots: ["CATALOG_INLINE"],
      priceLkr: 25000,
      interval: "WEEK",
      durationDays: 7,
      active: true,
      sortOrder: packages.length * 10 + 10,
    });
  }

  if (error && !slots.length && !loading) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  const enabledCount = slots.filter((row) => row.enabled).length;

  return (
    <div className="grid min-w-0 gap-8">
      <PlanningHero
        icon={LayoutGrid}
        kicker="Ads"
        title="Placement control"
        description="Turn ad slots on or off, set how often they appear, and price the packages vendors can buy."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ads">Campaigns</Link>
          </Button>
        }
      />

      {notice ? <FormStatus tone="success">{notice}</FormStatus> : null}
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

      <SectionCard title="Inventory" icon={tab === "slots" ? LayoutGrid : Package}>
        <HorizontalTabs
          ariaLabel="Placement control"
          activeId={tab}
          onChange={setTab}
          size="sm"
          items={[
            { id: "slots", label: "Slots", icon: LayoutGrid, badge: `${enabledCount}/${slots.length}` },
            { id: "packages", label: "Packages", icon: Package, badge: packages.length },
          ]}
        />
        {tab === "slots" ? (
          <>
            {slotChrome ? (
              <AdminListToolbar
                searchValue={query}
                onSearchChange={setQuery}
                searchPlaceholder="Search slot, page or region…"
                filters={
                  <>
                    <Combobox
                      aria-label="Filter by page"
                      className="w-full sm:w-44"
                      value={pageFilter}
                      onValueChange={setPageFilter}
                      options={[{ value: "all", label: "All pages" }, ...pageOptions]}
                    />
                    <Combobox
                      aria-label="Filter by status"
                      className="w-full sm:w-40"
                      value={liveFilter}
                      onValueChange={setLiveFilter}
                      options={[
                        { value: "all", label: "Any status" },
                        { value: "on", label: "Live" },
                        { value: "off", label: "Off" },
                      ]}
                    />
                  </>
                }
                summary={loading ? "Loading…" : `${slotPager.total} slot${slotPager.total === 1 ? "" : "s"}`}
              />
            ) : null}
            <DataTableList
              framed={false}
              loading={loading}
              loadingColumns={SLOT_COLUMNS.length}
              sourceCount={slots.length}
              filteredCount={visibleSlots.length}
              empty={{ icon: LayoutGrid, title: "No slots", description: "Slots appear once the API seeds them." }}
              filteredEmpty={{ onClearFilters: clearSlotFilters }}
              pagination={
                slotPager.totalPages > 0
                  ? {
                      page: slotPager.page,
                      totalPages: slotPager.totalPages,
                      total: slotPager.total,
                      limit: slotPager.limit,
                      onPageChange: slotPager.setPage,
                      onLimitChange: slotPager.setLimit,
                    }
                  : null
              }
              items={slotPager.pageItems}
              getRowId={(row) => row.slot}
              orderedVisibleIds={SLOT_COLUMNS}
              renderHead={(id) => {
                const labels: Record<(typeof SLOT_COLUMNS)[number], string> = {
                  slot: "Slot",
                  delivery: "Delivery & price",
                  perf: "Performance",
                  live: "Live",
                  actions: "Actions",
                };
                return <DataTableHead key={id}>{labels[id as (typeof SLOT_COLUMNS)[number]]}</DataTableHead>;
              }}
              renderCell={(id, row) => {
                const meta = SLOT_META[row.slot];
                switch (id) {
                  case "slot":
                    return (
                      <DataTableCell key={id}>
                        <div className="grid gap-0.5">
                          <span className="font-medium">{meta?.label ?? row.slot}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {row.pageKey} · {row.regionKey}
                          </span>
                        </div>
                      </DataTableCell>
                    );
                  case "delivery":
                    return (
                      <DataTableCell key={id}>
                        <div className="grid gap-0.5 whitespace-nowrap">
                          <span>
                            {LAYOUT_META[row.defaultLayout]?.label}
                            <span className="text-muted-foreground tabular-nums">
                              {" "}
                              · max {row.maxPerRequest}
                              {row.densityEveryN ? ` · every ${row.densityEveryN}` : ""}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {DISCLOSURE_LABEL[row.disclosure]} ·{" "}
                            {row.priceLkr > 0 ? money(row.priceLkr, row.interval) : "Included"}
                          </span>
                        </div>
                      </DataTableCell>
                    );
                  case "__price":
                    return (
                      <DataTableCell key={id}>
                        <span className="whitespace-nowrap tabular-nums">
                          {row.priceLkr > 0 ? money(row.priceLkr, row.interval) : "Included"}
                        </span>
                      </DataTableCell>
                    );
                  case "perf": {
                    const stats = analyticsBySlot.get(row.slot);
                    return (
                      <DataTableCell key={id}>
                        {stats ? (
                          <PromotionPerf impressions={stats.impressions} clicks={stats.clicks} />
                        ) : (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </DataTableCell>
                    );
                  }
                  case "live":
                    return (
                      <DataTableCell key={id}>
                        <Switch
                          checked={row.enabled}
                          onCheckedChange={(checked) => void toggleSlot(row, checked)}
                          aria-label={`${meta?.label ?? row.slot} live`}
                        />
                      </DataTableCell>
                    );
                  case "actions":
                    return (
                      <DataTableCell key={id}>
                        <Button size="sm" variant="outline" className="h-8 gap-1 px-2.5" onClick={() => openSlot(row)}>
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Button>
                      </DataTableCell>
                    );
                  default:
                    return null;
                }
              }}
            />
          </>
        ) : (
          <>
            {pkgChrome ? (
              <AdminListToolbar
                searchValue={pkgQuery}
                onSearchChange={setPkgQuery}
                searchPlaceholder="Search packages…"
                filters={
                  <Combobox
                    aria-label="Filter by status"
                    className="w-full sm:w-40"
                    value={pkgStatus}
                    onValueChange={setPkgStatus}
                    options={[
                      { value: "all", label: "Any status" },
                      { value: "active", label: "Active" },
                      { value: "hidden", label: "Hidden" },
                    ]}
                  />
                }
                actions={
                  <Button size="sm" onClick={newPackage}>
                    <Plus className="size-4" aria-hidden />
                    New package
                  </Button>
                }
                summary={loading ? "Loading…" : `${pkgPager.total} package${pkgPager.total === 1 ? "" : "s"}`}
              />
            ) : null}
            <DataTableList
              framed={false}
              loading={loading}
              loadingColumns={PKG_COLUMNS.length}
              sourceCount={packages.length}
              filteredCount={visiblePackages.length}
              empty={{
                icon: Package,
                title: "No packages yet",
                description: "Create a package vendors can buy in Promote.",
                action: (
                  <Button size="sm" onClick={newPackage}>
                    <Plus className="size-4" aria-hidden />
                    New package
                  </Button>
                ),
              }}
              filteredEmpty={{
                onClearFilters: () => {
                  setPkgQuery("");
                  setPkgStatus("all");
                },
              }}
              pagination={
                pkgPager.totalPages > 0
                  ? {
                      page: pkgPager.page,
                      totalPages: pkgPager.totalPages,
                      total: pkgPager.total,
                      limit: pkgPager.limit,
                      onPageChange: pkgPager.setPage,
                      onLimitChange: pkgPager.setLimit,
                    }
                  : null
              }
              items={pkgPager.pageItems}
              getRowId={(row) => row.id}
              orderedVisibleIds={PKG_COLUMNS}
              renderHead={(id) => {
                const labels: Record<(typeof PKG_COLUMNS)[number], string> = {
                  name: "Package",
                  slots: "Slots",
                  price: "Price",
                  runs: "Runs",
                  status: "Status",
                  actions: "Actions",
                };
                return <DataTableHead key={id}>{labels[id as (typeof PKG_COLUMNS)[number]]}</DataTableHead>;
              }}
              renderCell={(id, pkg) => {
                switch (id) {
                  case "name":
                    return (
                      <DataTableCell key={id}>
                        <div className="grid gap-0.5">
                          <span className="font-medium">{pkg.name}</span>
                          {pkg.description ? (
                            <span className="line-clamp-1 text-xs text-muted-foreground">{pkg.description}</span>
                          ) : null}
                        </div>
                      </DataTableCell>
                    );
                  case "slots":
                    return (
                      <DataTableCell key={id}>
                        <span className="text-xs text-muted-foreground">
                          {pkg.slots.map((slot) => SLOT_META[slot]?.label ?? slot).join(", ")}
                        </span>
                      </DataTableCell>
                    );
                  case "price":
                    return (
                      <DataTableCell key={id}>
                        <span className="whitespace-nowrap tabular-nums">{money(pkg.priceLkr, pkg.interval)}</span>
                      </DataTableCell>
                    );
                  case "runs":
                    return (
                      <DataTableCell key={id}>
                        <span className="whitespace-nowrap tabular-nums">{pkg.durationDays} days</span>
                      </DataTableCell>
                    );
                  case "status":
                    return (
                      <DataTableCell key={id}>
                        <Badge intent={pkg.active ? "success" : "outline"}>{pkg.active ? "Active" : "Hidden"}</Badge>
                      </DataTableCell>
                    );
                  case "actions":
                    return (
                      <DataTableCell key={id}>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => editPackage(pkg)}>
                            <Pencil className="size-3.5" aria-hidden />
                            Edit
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete ${pkg.name}`}
                            onClick={() => setPendingDelete(pkg)}
                          >
                            <Trash2 className="size-4 text-destructive" aria-hidden />
                          </Button>
                        </div>
                      </DataTableCell>
                    );
                  default:
                    return null;
                }
              }}
            />
          </>
        )}
      </SectionCard>

      {/* Slot editor */}
      <FloatingPanel open={Boolean(draft)} onOpenChange={(open) => (!open ? setDraft(null) : null)}>
        <FloatingPanelContent side="right" width="32rem">
          {draft ? (
            <>
              <FloatingPanelHeader
                icon={LayoutGrid}
                title={SLOT_META[draft.slot]?.label ?? draft.slot}
                description={SLOT_META[draft.slot]?.where}
              />
              <FloatingPanelBody className="gap-6">
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">Live on the public site</span>
                    <span className="text-xs text-muted-foreground">Off hides every ad in this slot.</span>
                  </span>
                  <Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Page">
                    <Input value={draft.pageKey} onChange={(e) => setDraft({ ...draft, pageKey: e.target.value })} />
                  </Field>
                  <Field label="Region">
                    <Input
                      value={draft.regionKey}
                      onChange={(e) => setDraft({ ...draft, regionKey: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default layout">
                    <Combobox
                      value={draft.defaultLayout}
                      onValueChange={(value) => setDraft({ ...draft, defaultLayout: value as PromotionLayout })}
                      options={PROMOTION_LAYOUTS.map((layout) => ({ value: layout, label: LAYOUT_META[layout].label }))}
                    />
                  </Field>
                  <Field label="Disclosure">
                    <Combobox
                      value={draft.disclosure}
                      onValueChange={(value) => setDraft({ ...draft, disclosure: value as PromotionDisclosure })}
                      options={DISCLOSURES.map((item) => ({ value: item, label: DISCLOSURE_LABEL[item] }))}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Max ads">
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={draft.maxPerRequest}
                      onChange={(e) => setDraft({ ...draft, maxPerRequest: Number(e.target.value) || 1 })}
                    />
                  </Field>
                  <Field label="Every N (grids)">
                    <Input
                      type="number"
                      min={1}
                      max={48}
                      placeholder="—"
                      value={draft.densityEveryN ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, densityEveryN: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </Field>
                  <Field label="Sort order">
                    <Input
                      type="number"
                      value={draft.sortOrder}
                      onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Price">
                    <Input
                      type="number"
                      min={0}
                      value={draft.priceLkr}
                      onChange={(e) => setDraft({ ...draft, priceLkr: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Per">
                    <Combobox
                      value={draft.interval}
                      onValueChange={(value) => setDraft({ ...draft, interval: value as PromotionBillingInterval })}
                      options={INTERVALS.map((item) => ({ value: item, label: INTERVAL_LABEL[item] }))}
                    />
                  </Field>
                  <Field label="Currency">
                    <Input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} />
                  </Field>
                </div>
                <Field label="Internal notes">
                  <Textarea
                    rows={2}
                    value={draft.notes ?? ""}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
                  />
                </Field>
                <div className="grid gap-2 rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Running now {preview.length ? `· ${preview.length}` : ""}
                  </p>
                  {preview.length ? (
                    preview.map((promo) => (
                      <div key={promo.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{promo.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {promo.effectiveBadge ?? promo.badgeLabel ?? "—"} · priority {promo.priority}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {draft.enabled ? "No live campaigns in this slot." : "Slot is off."}
                    </p>
                  )}
                </div>
              </FloatingPanelBody>
              <FloatingPanelFooter className="flex items-center justify-end gap-2 space-y-0">
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveSlot()} disabled={saving}>
                  <Save className="size-4" aria-hidden />
                  {saving ? "Saving…" : "Save"}
                </Button>
              </FloatingPanelFooter>
            </>
          ) : null}
        </FloatingPanelContent>
      </FloatingPanel>

      {/* Package editor */}
      <FloatingPanel
        open={Boolean(pkgDraft)}
        onOpenChange={(open) => {
          if (!open) {
            setPkgDraft(null);
            setEditingPkgId(null);
          }
        }}
      >
        <FloatingPanelContent side="right" width="32rem">
          {pkgDraft ? (
            <>
              <FloatingPanelHeader
                icon={Package}
                title={editingPkgId ? pkgDraft.name || "Edit package" : "New package"}
                description="Vendors pick packages in their Promote studio."
              />
              <FloatingPanelBody className="gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={pkgDraft.name}
                      placeholder="Search boost — 1 week"
                      onChange={(e) => setPkgDraft({ ...pkgDraft, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Slug">
                    <Input value={pkgDraft.slug} onChange={(e) => setPkgDraft({ ...pkgDraft, slug: e.target.value })} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={pkgDraft.description ?? ""}
                    onChange={(e) => setPkgDraft({ ...pkgDraft, description: e.target.value || null })}
                  />
                </Field>
                <Field label="Slots included" hint={`${pkgDraft.slots.length} selected`}>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMOTION_SLOTS.map((slot) => {
                      const active = pkgDraft.slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() =>
                            setPkgDraft({
                              ...pkgDraft,
                              slots: active
                                ? pkgDraft.slots.filter((item) => item !== slot)
                                : [...pkgDraft.slots, slot],
                            })
                          }
                        >
                          {SLOT_META[slot].label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Price (LKR)">
                    <Input
                      type="number"
                      value={pkgDraft.priceLkr}
                      onChange={(e) => setPkgDraft({ ...pkgDraft, priceLkr: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Per">
                    <Combobox
                      value={pkgDraft.interval}
                      onValueChange={(value) =>
                        setPkgDraft({ ...pkgDraft, interval: value as PromotionBillingInterval })
                      }
                      options={INTERVALS.map((item) => ({ value: item, label: INTERVAL_LABEL[item] }))}
                    />
                  </Field>
                  <Field label="Runs (days)">
                    <Input
                      type="number"
                      value={pkgDraft.durationDays}
                      onChange={(e) => setPkgDraft({ ...pkgDraft, durationDays: Number(e.target.value) || 7 })}
                    />
                  </Field>
                </div>
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">Shown to vendors in Promote.</span>
                  </span>
                  <Switch
                    checked={pkgDraft.active}
                    onCheckedChange={(active) => setPkgDraft({ ...pkgDraft, active })}
                  />
                </label>
              </FloatingPanelBody>
              <FloatingPanelFooter className="flex items-center justify-end gap-2 space-y-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPkgDraft(null);
                    setEditingPkgId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void savePackage()}
                  disabled={saving || !pkgDraft.slots.length || !pkgDraft.name.trim()}
                >
                  <Save className="size-4" aria-hidden />
                  {saving ? "Saving…" : "Save"}
                </Button>
              </FloatingPanelFooter>
            </>
          ) : null}
        </FloatingPanelContent>
      </FloatingPanel>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete “${pendingDelete?.name ?? ""}”?`}
        description="Vendors will no longer be able to buy it. Running campaigns keep their placements."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) void removePackage(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
