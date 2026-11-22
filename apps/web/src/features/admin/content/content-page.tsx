"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminArticle } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["title", "status", "category", "actions"] as const;

export default function AdminContentPage() {
  const [rows, setRows] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.articles());
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
      <PlanningHero
        icon={Lightbulb}
        kicker="CMS"
        title="Ideas content"
        description="Draft, publish, and feature editorial articles."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/content/new">New article</Link>
          </Button>
        }
      />
      <SectionCard title="Articles" icon={Lightbulb}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={rows.length}
          filteredCount={filtered.length}
          empty={{
            icon: Lightbulb,
            title: "No articles",
            description: "Create the first Ideas piece.",
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
              title: "Title",
              status: "Status",
              category: "Category",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "title":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.slug}</p>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={row.status === "PUBLISHED" ? "success" : undefined}>{row.status}</Badge>
                    {row.featured ? (
                      <Badge intent="love" className="ml-1">
                        Featured
                      </Badge>
                    ) : null}
                  </DataTableCell>
                );
              case "category":
                return <DataTableCell key={id}>{row.category}</DataTableCell>;
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/content/${row.id}`}>Edit</Link>
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
