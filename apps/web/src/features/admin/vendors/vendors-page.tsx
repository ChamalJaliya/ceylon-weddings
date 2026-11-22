"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ShieldCheck, Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { Checkbox } from "@ceylonweddings/ui/components/checkbox";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CategoryPills, FilterChip } from "@ceylonweddings/ui/domain/async-list";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, serverSourceCount, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS } from "@/lib/labels";

const COLUMNS = ["select", "vendor", "location", "status", "gate", "actions"] as const;

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [quick, setQuick] = useState<"all" | "unverified" | "featured" | "gate">("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setVendors(await api.admin.vendors({ q: q || undefined }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setActiveCategory(cat);
    }
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(vendors.map((v) => v.category))).sort((a, b) =>
        (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b),
      ),
    [vendors],
  );

  const displayed = useMemo(
    () =>
      vendors.filter((v) => {
        if (activeCategory && v.category !== activeCategory) return false;
        if (quick === "unverified") return !v.verified;
        if (quick === "featured") return v.featured;
        if (quick === "gate") return presentationGateFailures(v).length > 0;
        return true;
      }),
    [vendors, activeCategory, quick],
  );
  const counts = useMemo(
    () => ({
      all: vendors.length,
      verified: vendors.filter((v) => v.verified).length,
      unverified: vendors.filter((v) => !v.verified).length,
      featured: vendors.filter((v) => v.featured).length,
      gate: vendors.filter((v) => presentationGateFailures(v).length > 0).length,
    }),
    [vendors],
  );

  const filterKey = `${q}|${activeCategory ?? ""}|${quick}`;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    displayed,
    25,
    filterKey,
  );
  const isDefaultView = !q && !activeCategory && quick === "all";
  const sourceCount =
    activeCategory || quick !== "all" ? vendors.length : serverSourceCount(vendors.length, isDefaultView);
  const emptyMode = getListEmptyMode({ sourceCount, filteredCount: displayed.length });
  const chrome = showListChrome(emptyMode, loading);

  async function exportCsv() {
    const csv = await api.admin.exportCsv("vendors");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vendors.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function bulkVerify() {
    if (!selected.length) return;
    await api.admin.bulkVendors({ ids: selected, verified: true });
    setSelected([]);
    await load();
  }

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PlanningHero
        icon={Store}
        kicker="Admin"
        title="Vendors"
        description="Search, filter, verify, and open listing detail."
        actions={
          chrome ? (
            <>
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                className={heroButtonClass}
                onClick={() => void exportCsv()}
              >
                <Download className="size-4" /> Export CSV
              </Button>
              <Button
                size="sm"
                shape="pill"
                className="gap-2 bg-paper text-ink hover:bg-paper/90 disabled:opacity-40"
                disabled={!selected.length}
                onClick={() => void bulkVerify()}
              >
                <ShieldCheck className="size-4" /> Verify {selected.length ? `${selected.length} selected` : "selected"}
              </Button>
            </>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { k: "Listings", v: counts.all },
            { k: "Verified", v: counts.verified },
            { k: "Unverified", v: counts.unverified, gold: counts.unverified > 0 },
            { k: "Featured", v: counts.featured },
            { k: "Not ready", v: counts.gate },
          ].map((stat) => (
            <div key={stat.k}>
              <p className="text-xs text-paper/60">{stat.k}</p>
              <p className={stat.gold ? "font-serif text-2xl text-[color:var(--cw-gold-300)]" : "font-serif text-2xl"}>
                {stat.v}
              </p>
            </div>
          ))}
        </div>
      </PlanningHero>
      <SectionCard title="Listings" icon={Store}>
        {chrome ? (
          <div className="inline-flex w-fit flex-wrap rounded-full border border-border bg-background p-1">
            {(
              [
                { id: "all", label: "All", n: counts.all },
                { id: "unverified", label: "Unverified", n: counts.unverified },
                { id: "featured", label: "Featured", n: counts.featured },
                { id: "gate", label: "Not ready", n: counts.gate },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuick(f.id)}
                className={
                  quick === f.id
                    ? "rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground"
                    : "rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {f.label} <span className="ml-1 opacity-60 tabular-nums">{f.n}</span>
              </button>
            ))}
          </div>
        ) : null}
        {chrome && categories.length > 0 ? (
          <div className="mb-4">
            <CategoryPills>
              <FilterChip active={!activeCategory} onClick={() => setActiveCategory(null)}>
                All
              </FilterChip>
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const count = vendors.filter((v) => v.category === cat).length;
                return (
                  <FilterChip key={cat} active={isActive} onClick={() => setActiveCategory(isActive ? null : cat)}>
                    {CATEGORY_LABELS[cat] ?? cat}
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-px text-label tabular-nums ${
                        isActive ? "bg-primary-foreground/20" : "bg-border"
                      }`}
                    >
                      {count}
                    </span>
                  </FilterChip>
                );
              })}
            </CategoryPills>
          </div>
        ) : null}
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name, city, slug…"
            summary={loading ? "Loading…" : `${total} listing${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={sourceCount}
          filteredCount={displayed.length}
          empty={{
            icon: Store,
            title: "No vendors",
            description: "Vendor listings will appear here.",
          }}
          filteredEmpty={{
            onClearFilters: () => {
              setQ("");
              setActiveCategory(null);
              setQuick("all");
            },
          }}
          pagination={
            totalPages > 0
              ? {
                  page,
                  totalPages,
                  total,
                  limit,
                  onPageChange: setPage,
                  onLimitChange: setLimit,
                }
              : null
          }
          items={pageItems}
          getRowId={(vendor) => vendor.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              select: "",
              vendor: "Vendor",
              location: "Location",
              status: "Status",
              gate: "Gate",
              actions: "",
            };
            return (
              <DataTableHead key={id} className={id === "select" ? "w-10" : id === "actions" ? "w-16" : undefined}>
                {labels[id as (typeof COLUMNS)[number]]}
              </DataTableHead>
            );
          }}
          renderCell={(id, vendor) => {
            const failures = presentationGateFailures(vendor);
            switch (id) {
              case "select":
                return (
                  <DataTableCell key={id}>
                    <Checkbox
                      checked={selected.includes(vendor.id)}
                      onCheckedChange={(checked) => {
                        setSelected((current) =>
                          checked === true ? [...current, vendor.id] : current.filter((itemId) => itemId !== vendor.id),
                        );
                      }}
                      aria-label={`Select ${vendor.name}`}
                    />
                  </DataTableCell>
                );
              case "vendor":
                return (
                  <DataTableCell key={id}>
                    <Link href={`/admin/vendors/${vendor.id}`} className="group flex items-center gap-3">
                      {(vendor.photoUrl ?? vendor.photos?.[0]) ? (
                        <img
                          src={vendor.photoUrl ?? vendor.photos?.[0] ?? ""}
                          alt=""
                          className="size-10 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-medium">
                          {vendor.name.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">{vendor.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                        </span>
                      </span>
                    </Link>
                  </DataTableCell>
                );
              case "location":
                return (
                  <DataTableCell key={id}>
                    {[...new Set([vendor.city, vendor.district].filter(Boolean))].join(", ")}
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <div className="flex flex-wrap items-center gap-1">
                      {vendor.verified ? (
                        <Badge intent="success">Verified</Badge>
                      ) : (
                        <Badge intent="warning">Unverified</Badge>
                      )}
                      {vendor.featured ? <Badge intent="love">Featured</Badge> : null}
                      {vendor.moderationStatus && vendor.moderationStatus !== "APPROVED" ? (
                        <Badge>
                          {vendor.moderationStatus.charAt(0) + vendor.moderationStatus.slice(1).toLowerCase()}
                        </Badge>
                      ) : null}
                    </div>
                  </DataTableCell>
                );
              case "gate":
                return (
                  <DataTableCell key={id}>
                    {failures.length === 0 ? (
                      <Badge intent="success">Ready</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{failures[0]}</span>
                    )}
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/vendors/${vendor.id}`}>Open</Link>
                    </Button>
                  </DataTableCell>
                );
              default:
                return null;
            }
          }}
        />
      </SectionCard>
    </div>
  );
}
