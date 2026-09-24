"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Report } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../../i18n/navigation";

export default function AdminReportsQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [entityId, setEntityId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const load = useCallback(async () => {
    try {
      setReports(await api.admin.reports("OPEN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDemo() {
    if (!entityId || !reason) return;
    await api.admin.createReport({
      entityType: "VENDOR",
      entityId,
      reason,
      details: details || undefined,
    });
    setEntityId("");
    setReason("");
    setDetails("");
    await load();
  }

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
        icon={Flag}
        kicker="Queue"
        title="Reports"
        description="Abuse and takedown inbox."
      />
      <SectionCard title="File report (ops ingest)" icon={Flag}>
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Vendor id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button onClick={() => void createDemo()}>Create</Button>
        </div>
        <Textarea className="mt-2" placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} rows={2} />
      </SectionCard>
      <SectionCard title="Open" icon={Flag}>
        {reports.length === 0 ? (
          <EmptyState icon={Flag} title="Inbox clear" description="No open reports." />
        ) : (
          <AdminDataTable headers={["Entity", "Reason", "Reporter", ""]}>
            {reports.map((report) => (
              <AdminDataRow key={report.id}>
                <AdminDataCell>
                  <Badge>{report.entityType}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">{report.entityId}</p>
                </AdminDataCell>
                <AdminDataCell>
                  <p className="font-medium">{report.reason}</p>
                  {report.details ? <p className="text-xs text-muted-foreground">{report.details}</p> : null}
                </AdminDataCell>
                <AdminDataCell>{report.reporterName ?? "Anonymous"}</AdminDataCell>
                <AdminDataCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await api.admin.resolveReport(report.id, { status: "RESOLVED" });
                        await load();
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.admin.resolveReport(report.id, { status: "DISMISSED" });
                        await load();
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
