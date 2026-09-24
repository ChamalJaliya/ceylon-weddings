"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminArticle } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminContentPage() {
  const [rows, setRows] = useState<AdminArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.articles());
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
        {rows.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No articles" description="Create the first Ideas piece." />
        ) : (
          <AdminDataTable headers={["Title", "Status", "Category", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.slug}</p>
                </AdminDataCell>
                <AdminDataCell>
                  <Badge intent={row.status === "PUBLISHED" ? "success" : undefined}>{row.status}</Badge>
                  {row.featured ? <Badge intent="love" className="ml-1">Featured</Badge> : null}
                </AdminDataCell>
                <AdminDataCell>{row.category}</AdminDataCell>
                <AdminDataCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/content/${row.id}`}>Edit</Link>
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
