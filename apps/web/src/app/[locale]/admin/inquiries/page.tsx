"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminInquiry } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState<AdminInquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.inquiries());
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
      <PageHeader icon={Inbox} kicker="Marketplace" title="Inquiries" description="Cross-vendor lead oversight." />
      <SectionCard title="Leads" icon={Inbox}>
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No inquiries" description="Leads will appear here." />
        ) : (
          <AdminDataTable headers={["Couple", "Vendor", "Status", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">{row.coupleNames}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{row.message}</p>
                </AdminDataCell>
                <AdminDataCell>{row.vendorName}</AdminDataCell>
                <AdminDataCell>
                  <Badge>{row.status}</Badge>
                </AdminDataCell>
                <AdminDataCell>
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
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
