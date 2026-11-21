"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminWeddingSummary } from "@ceylonweddings/contracts";
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

const COLUMNS = ["couple", "location", "team", "actions"] as const;

export default function AdminWeddingsPage() {
  const [rows, setRows] = useState<AdminWeddingSummary[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.weddings({ q: q || undefined }));
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
  const isDefaultView = !q;
  const sourceCount = serverSourceCount(rows.length, isDefaultView);
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
        icon={CalendarDays}
        kicker="Support"
        title="Weddings"
        description="Read-only lookup by couple name, slug, city, or member email."
      />
      <SectionCard title="Results" icon={CalendarDays}>
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search…"
            summary={loading ? "Loading…" : `${total} wedding${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={sourceCount}
          filteredCount={filtered.length}
          empty={{
            icon: CalendarDays,
            title: "No weddings",
            description: "Weddings will appear here.",
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
              couple: "Couple",
              location: "Location",
              team: "Team",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "couple":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">
                      {row.partnerOneName} & {row.partnerTwoName}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.slug}</p>
                  </DataTableCell>
                );
              case "location":
                return (
                  <DataTableCell key={id}>
                    {row.city ?? "—"}
                    {row.date ? ` · ${new Date(row.date).toLocaleDateString()}` : ""}
                  </DataTableCell>
                );
              case "team":
                return (
                  <DataTableCell key={id}>
                    {row.bookedVendorCount} booked · {row.guestHouseholdCount} households
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/weddings/${row.id}`}>Open</Link>
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
