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
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["entity", "reason", "reporter", "actions"] as const;

export default function AdminReportsQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [showFile, setShowFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityId, setEntityId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setReports(await api.admin.reports("OPEN"));
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

  const filtered = reports;
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
        icon={Flag}
        kicker="Queue"
        title="Reports"
        description="Abuse and takedown inbox."
        actions={
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            className={heroButtonClass}
            onClick={() => setShowFile((v) => !v)}
          >
            {showFile ? "Close" : "File a report"}
          </Button>
        }
      >
        <div>
          <p
            className={
              reports.length
                ? "font-serif text-5xl leading-none text-[color:var(--cw-gold-300)]"
                : "font-serif text-5xl leading-none"
            }
          >
            {reports.length}
          </p>
          <p className="mt-1 text-sm text-paper/70">{reports.length ? "open reports" : "Inbox clear"}</p>
        </div>
      </PlanningHero>
      {showFile ? (
        <SectionCard title="File a report (ops)" icon={Flag}>
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Vendor id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button onClick={() => void createDemo()}>Create</Button>
          </div>
          <Textarea
            className="mt-2"
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
          />
        </SectionCard>
      ) : null}
      <SectionCard title="Open" icon={Flag}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={reports.length}
          filteredCount={filtered.length}
          empty={{
            icon: Flag,
            title: "Inbox clear",
            description: "No open reports.",
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
          getRowId={(report) => report.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              entity: "Entity",
              reason: "Reason",
              reporter: "Reporter",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, report) => {
            switch (id) {
              case "entity":
                return (
                  <DataTableCell key={id}>
                    <Badge>{report.entityType}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{report.entityId}</p>
                  </DataTableCell>
                );
              case "reason":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{report.reason}</p>
                    {report.details ? <p className="text-xs text-muted-foreground">{report.details}</p> : null}
                  </DataTableCell>
                );
              case "reporter":
                return <DataTableCell key={id}>{report.reporterName ?? "Anonymous"}</DataTableCell>;
              case "actions":
                return (
                  <DataTableCell key={id}>
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
