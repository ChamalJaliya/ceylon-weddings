"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminInquiry } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["couple", "vendor", "status", "actions"] as const;

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.inquiries());
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
      <PageHeader icon={Inbox} kicker="Marketplace" title="Inquiries" description="Cross-vendor lead oversight." />
      <SectionCard title="Leads" icon={Inbox}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={rows.length}
          filteredCount={filtered.length}
          empty={{
            icon: Inbox,
            title: "No inquiries",
            description: "Leads will appear here.",
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
              vendor: "Vendor",
              status: "Status",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "couple":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{row.coupleNames}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{row.message}</p>
                  </DataTableCell>
                );
              case "vendor":
                return <DataTableCell key={id}>{row.vendorName}</DataTableCell>;
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge>{row.status}</Badge>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    {row.status !== "CLOSED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await api.admin.closeInquiry(row.id);
                          await load();
                        }}
                      >
                        Force close
                      </Button>
                    ) : null}
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
