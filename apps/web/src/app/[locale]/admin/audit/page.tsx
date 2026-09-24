"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AuditLog } from "@ceylonweddings/contracts";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AuditTimeline } from "@ceylonweddings/ui/domain/audit-timeline";
import { Link } from "../../../../i18n/navigation";

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.admin.audit({ q: q || undefined }));
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
      <PageHeader icon={FileText} kicker="Compliance" title="Audit trail" description="Every admin mutation is attributable." />
      <SectionCard title="Events" icon={FileText}>
        <div className="mb-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter action / entity…" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No events" description="Mutations will appear here." />
        ) : (
          <AuditTimeline items={rows} />
        )}
      </SectionCard>
    </div>
  );
}
