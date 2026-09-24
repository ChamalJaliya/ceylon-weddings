"use client";

import { useCallback, useEffect, useState } from "react";
import { Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";
import { CATEGORY_LABELS } from "../../../../lib/labels";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setVendors(await api.admin.vendors({ q: q || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  // Read ?category= from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setActiveCategory(cat);
    }
  }, []);

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

  // Derive available categories from current vendor list
  const categories = Array.from(new Set(vendors.map((v) => v.category))).sort(
    (a, b) => (CATEGORY_LABELS[a] ?? a).localeCompare(CATEGORY_LABELS[b] ?? b),
  );

  // Apply category filter client-side
  const displayed = activeCategory
    ? vendors.filter((v) => v.category === activeCategory)
    : vendors;

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Store}
        kicker="Admin"
        title="Vendors"
        description="Search, filter, verify, and open listing detail."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
              Export CSV
            </Button>
            <Button size="sm" disabled={!selected.length} onClick={() => void bulkVerify()}>
              Bulk verify ({selected.length})
            </Button>
          </div>
        }
      />
      <SectionCard title="Listings" icon={Store}>
        {/* Category chip rail */}
        {categories.length > 0 && (
          <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                !activeCategory
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-secondary/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = vendors.filter((v) => v.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-secondary/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                  <span
                    className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                      isActive ? "bg-primary-foreground/20" : "bg-border"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-4">
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search name, city, slug…"
          />
        </div>
        {displayed.length === 0 ? (
          <EmptyState icon={Store} title="No vendors" description="Vendor listings will appear here." />
        ) : (
          <AdminDataTable headers={["", "Vendor", "Location", "Status", "Gate", ""]}>
            {displayed.map((vendor) => {
              const failures = presentationGateFailures(vendor);
              return (
                <AdminDataRow key={vendor.id}>
                  <AdminDataCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(vendor.id)}
                      onChange={(event) => {
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, vendor.id]
                            : current.filter((id) => id !== vendor.id),
                        );
                      }}
                    />
                  </AdminDataCell>
                  <AdminDataCell>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                    </p>
                  </AdminDataCell>
                  <AdminDataCell>
                    {vendor.city}, {vendor.district}
                  </AdminDataCell>
                  <AdminDataCell>
                    <div className="flex flex-wrap gap-1">
                      {vendor.verified ? <Badge intent="success">Verified</Badge> : <Badge>Unverified</Badge>}
                      {vendor.featured ? <Badge intent="love">Featured</Badge> : null}
                      {vendor.moderationStatus ? <Badge>{vendor.moderationStatus}</Badge> : null}
                    </div>
                  </AdminDataCell>
                  <AdminDataCell>
                    {failures.length === 0 ? (
                      <Badge intent="success">Ready</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{failures[0]}</span>
                    )}
                  </AdminDataCell>
                  <AdminDataCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/vendors/${vendor.id}`}>Open</Link>
                    </Button>
                  </AdminDataCell>
                </AdminDataRow>
              );
            })}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
