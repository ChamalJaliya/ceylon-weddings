"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminReview } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.reviews());
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
      <PageHeader icon={Star} kicker="Moderation" title="Reviews" description="Hide abusive reviews from public storefronts." />
      <SectionCard title="All reviews" icon={Star}>
        {rows.length === 0 ? (
          <EmptyState icon={Star} title="No reviews" description="Reviews appear once couples submit them." />
        ) : (
          <AdminDataTable headers={["Vendor", "Author", "Rating", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">{row.vendorName}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{row.body}</p>
                </AdminDataCell>
                <AdminDataCell>{row.authorName}</AdminDataCell>
                <AdminDataCell>
                  {row.rating}
                  {row.hidden ? <Badge intent="danger" className="ml-2">Hidden</Badge> : null}
                </AdminDataCell>
                <AdminDataCell>
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
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
