"use client";

import { useCallback, useEffect, useState } from "react";
import { Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { FeaturedPlacement, Vendor } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["vendor", "window", "source", "actions"] as const;

export default function AdminFeaturedPage() {
  const [rows, setRows] = useState<FeaturedPlacement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [placements, vendorRows] = await Promise.all([api.admin.featured(), api.admin.vendors()]);
      setRows(placements);
      setVendors(vendorRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, "");

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
        kicker="Inventory"
        title="Featured placements"
        description="Schedule editorial / comped placements before payment gateways."
      />
      <SectionCard title="Create placement" icon={Store}>
        <div className="grid gap-2 md:grid-cols-4">
          <SimpleSelect
            value={vendorId}
            onValueChange={setVendorId}
            placeholder="Select vendor"
            aria-label="Select vendor"
            options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
          />
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          <Button
            onClick={async () => {
              if (!vendorId || !startsAt || !endsAt) return;
              await api.admin.createFeatured({
                vendorId,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                priority: 0,
                source: "EDITORIAL",
              });
              setVendorId("");
              setStartsAt("");
              setEndsAt("");
              await load();
            }}
          >
            Add
          </Button>
        </div>
      </SectionCard>
      <SectionCard title="Schedule" icon={Store}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={rows.length}
          filteredCount={filtered.length}
          empty={{
            icon: Store,
            title: "No placements",
            description: "Create an editorial window above.",
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
          getRowId={(row) => row.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              vendor: "Vendor",
              window: "Window",
              source: "Source",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "vendor":
                return <DataTableCell key={id}>{row.vendorName ?? row.vendorId}</DataTableCell>;
              case "window":
                return (
                  <DataTableCell key={id}>
                    {new Date(row.startsAt).toLocaleString()} → {new Date(row.endsAt).toLocaleString()}
                  </DataTableCell>
                );
              case "source":
                return <DataTableCell key={id}>{row.source}</DataTableCell>;
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.admin.deleteFeatured(row.id);
                        await load();
                      }}
                    >
                      Delete
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
