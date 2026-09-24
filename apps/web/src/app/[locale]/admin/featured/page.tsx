"use client";

import { useCallback, useEffect, useState } from "react";
import { Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { FeaturedPlacement, Vendor } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminFeaturedPage() {
  const [rows, setRows] = useState<FeaturedPlacement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [placements, vendorRows] = await Promise.all([api.admin.featured(), api.admin.vendors()]);
      setRows(placements);
      setVendors(vendorRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
          >
            <option value="">Select vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
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
        {rows.length === 0 ? (
          <EmptyState icon={Store} title="No placements" description="Create an editorial window above." />
        ) : (
          <AdminDataTable headers={["Vendor", "Window", "Source", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>{row.vendorName ?? row.vendorId}</AdminDataCell>
                <AdminDataCell>
                  {new Date(row.startsAt).toLocaleString()} → {new Date(row.endsAt).toLocaleString()}
                </AdminDataCell>
                <AdminDataCell>{row.source}</AdminDataCell>
                <AdminDataCell>
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
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
