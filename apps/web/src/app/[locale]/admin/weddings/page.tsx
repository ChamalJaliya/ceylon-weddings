"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminWeddingSummary } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminWeddingsPage() {
  const [rows, setRows] = useState<AdminWeddingSummary[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.weddings({ q: q || undefined }));
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
        icon={CalendarDays}
        kicker="Support"
        title="Weddings"
        description="Read-only lookup by couple name, slug, city, or member email."
      />
      <SectionCard title="Results" icon={CalendarDays}>
        <div className="mb-4">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search…" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No weddings" description="Try another search." />
        ) : (
          <AdminDataTable headers={["Couple", "Location", "Team", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">
                    {row.partnerOneName} & {row.partnerTwoName}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.slug}</p>
                </AdminDataCell>
                <AdminDataCell>
                  {row.city ?? "—"}
                  {row.date ? ` · ${new Date(row.date).toLocaleDateString()}` : ""}
                </AdminDataCell>
                <AdminDataCell>
                  {row.bookedVendorCount} booked · {row.guestHouseholdCount} households
                </AdminDataCell>
                <AdminDataCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/weddings/${row.id}`}>Open</Link>
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
