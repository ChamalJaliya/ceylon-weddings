"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminReview } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["vendor", "author", "rating", "actions"] as const;

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.reviews());
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
    <div className="grid min-w-0 gap-6">
      <PlanningHero
        icon={Star}
        kicker="Moderation"
        title="Reviews"
        description="Hide abusive reviews from public storefronts."
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-paper/60">Reviews</p>
            <p className="font-serif text-2xl">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Average</p>
            <p className="font-serif text-2xl text-[color:var(--cw-gold-300)]">
              {rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) + " ★" : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Low (1–2 ★)</p>
            <p className="font-serif text-2xl">{rows.filter((r) => r.rating <= 2).length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Hidden</p>
            <p className="font-serif text-2xl">{rows.filter((r) => r.hidden).length}</p>
          </div>
        </div>
      </PlanningHero>
      <SectionCard title="All reviews" icon={Star}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={rows.length}
          filteredCount={filtered.length}
          empty={{
            icon: Star,
            title: "No reviews",
            description: "Reviews appear once couples submit them.",
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
              author: "Author",
              rating: "Rating",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "vendor":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{row.vendorName}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{row.body}</p>
                  </DataTableCell>
                );
              case "author":
                return <DataTableCell key={id}>{row.authorName}</DataTableCell>;
              case "rating":
                return (
                  <DataTableCell key={id}>
                    {row.rating}
                    {row.hidden ? (
                      <Badge intent="danger" className="ml-2">
                        Hidden
                      </Badge>
                    ) : null}
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.admin.setReviewHidden(row.id, !row.hidden);
                        await load();
                      }}
                    >
                      {row.hidden ? "Unhide" : "Hide"}
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
