"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Store } from "lucide-react";
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
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
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
    () => (activeCategory ? vendors.filter((v) => v.category === activeCategory) : vendors),
    [vendors, activeCategory],
  );

  const filterKey = `${q}|${activeCategory ?? ""}`;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    displayed,
    25,
    filterKey,
  );
  const isDefaultView = !q && !activeCategory;
  const sourceCount = activeCategory ? vendors.length : serverSourceCount(vendors.length, isDefaultView);
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
    <div className="grid gap-8">
      <PageHeader
        icon={Store}
        kicker="Admin"
        title="Vendors"
        description="Search, filter, verify, and open listing detail."
        actions={
          chrome ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
                Export CSV
              </Button>
              <Button size="sm" disabled={!selected.length} onClick={() => void bulkVerify()}>
                Bulk verify ({selected.length})
              </Button>
            </div>
          ) : null
        }
      />
      <SectionCard title="Listings" icon={Store}>
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
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
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
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                    </p>
                  </DataTableCell>
                );
              case "location":
                return (
                  <DataTableCell key={id}>
                    {vendor.city}, {vendor.district}
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <div className="flex flex-wrap gap-1">
                      {vendor.verified ? <Badge intent="success">Verified</Badge> : <Badge>Unverified</Badge>}
                      {vendor.featured ? <Badge intent="love">Featured</Badge> : null}
                      {vendor.moderationStatus ? <Badge>{vendor.moderationStatus}</Badge> : null}
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
