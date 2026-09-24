"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Promotion } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminAdsPage() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.promotions({ q: q || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [q]);

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
        icon={Megaphone}
        kicker="Ads"
        title="Promotion studio"
        description="Fully customizable campaigns for homepage, catalog, and ideas."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/ads/new">New campaign</Link>
          </Button>
        }
      />
      <SectionCard title="Campaigns" icon={Megaphone}>
        <div className="mb-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or headline…" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns" description="Create a promotion with creative, targeting, and schedule." />
        ) : (
          <AdminDataTable headers={["Campaign", "Slots", "Status", "Perf", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.headline}</p>
                </AdminDataCell>
                <AdminDataCell>
                  <div className="flex flex-wrap gap-1">
                    {row.slots.map((slot) => (
                      <Badge key={slot}>{slot}</Badge>
                    ))}
                  </div>
                </AdminDataCell>
                <AdminDataCell>
                  <Badge intent={row.status === "ACTIVE" ? "success" : undefined}>{row.status}</Badge>
                </AdminDataCell>
                <AdminDataCell className="text-xs text-muted-foreground">
                  {row.impressionCount} imp · {row.clickCount} clk
                </AdminDataCell>
                <AdminDataCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/ads/${row.id}`}>Edit</Link>
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
