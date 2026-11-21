"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AuditLog } from "@ceylonweddings/contracts";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AuditTimeline } from "@ceylonweddings/ui/domain/audit-timeline";
import { Link } from "@/i18n/navigation";

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.audit({ q: q || undefined }));
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
        icon={FileText}
        kicker="Compliance"
        title="Audit trail"
        description="Every admin mutation is attributable."
      />
      <SectionCard title="Events" icon={FileText}>
        <AdminListToolbar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Filter action / entity…"
          summary={loading ? "Loading…" : `${rows.length} event${rows.length === 1 ? "" : "s"}`}
        />
        {loading ? (
          <CenteredLoader label="Loading audit events" />
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title="No events" description="Mutations will appear here." />
        ) : (
          <AuditTimeline items={rows} />
        )}
      </SectionCard>
    </div>
  );
}
