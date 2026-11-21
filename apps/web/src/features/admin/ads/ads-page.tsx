"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Promotion } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, serverSourceCount, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["campaign", "slots", "status", "perf", "actions"] as const;

export default function AdminAdsPage() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.promotions({ q: q || undefined }));
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

  const filtered = rows;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, q);
  const sourceCount = serverSourceCount(rows.length, !q);
  const emptyMode = getListEmptyMode({ sourceCount, filteredCount: filtered.length });
  const chrome = showListChrome(emptyMode, loading);

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
          chrome ? (
            <Button asChild size="sm">
              <Link href="/admin/ads/new">New campaign</Link>
            </Button>
          ) : null
        }
      />
      <SectionCard title="Campaigns" icon={Megaphone}>
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name or headline…"
            summary={loading ? "Loading…" : `${total} campaign${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={sourceCount}
          filteredCount={filtered.length}
          empty={{
            icon: Megaphone,
            title: "No campaigns",
            description: "Create a promotion with creative, targeting, and schedule.",
          }}
          filteredEmpty={{
            onClearFilters: () => setQ(""),
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
              campaign: "Campaign",
              slots: "Slots",
              status: "Status",
              perf: "Perf",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "campaign":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.headline}</p>
                  </DataTableCell>
                );
              case "slots":
                return (
                  <DataTableCell key={id}>
                    <div className="flex flex-wrap gap-1">
                      {row.slots.map((slot) => (
                        <Badge key={slot}>{slot}</Badge>
                      ))}
                    </div>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={row.status === "ACTIVE" ? "success" : undefined}>{row.status}</Badge>
                  </DataTableCell>
                );
              case "perf":
                return (
                  <DataTableCell key={id} className="text-xs text-muted-foreground">
                    {row.impressionCount} imp · {row.clickCount} clk
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/ads/${row.id}`}>Edit</Link>
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
