"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Inquiry } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

type Lead = Inquiry & { wedding: { partnerOneName: string; partnerTwoName: string } };

const COLUMNS = ["couple", "message", "status", "actions"] as const;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLeads(await api.vendors.leads());
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

  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(leads, 25);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={Briefcase}
        kicker="Vendor workspace"
        title="Leads"
        description="Every couple who has reached out — reply on WhatsApp in one tap."
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-paper/60">All leads</p>
            <p className="font-serif text-2xl">{leads.length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">New</p>
            <p className="font-serif text-2xl text-[color:var(--cw-gold-300)]">
              {leads.filter((lead) => lead.status === "NEW").length}
            </p>
          </div>
        </div>
      </PlanningHero>
      <SectionCard title="Inbox" icon={Briefcase} variant="muted">
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={leads.length}
          filteredCount={leads.length}
          empty={{
            icon: Briefcase,
            title: "No inquiries yet",
            description: "When couples reach out, they will appear here.",
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
          getRowId={(lead) => lead.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              couple: "Couple",
              message: "Message",
              status: "Status",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, lead) => {
            switch (id) {
              case "couple":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">
                      {lead.wedding.partnerOneName} & {lead.wedding.partnerTwoName}
                    </p>
                  </DataTableCell>
                );
              case "message":
                return (
                  <DataTableCell key={id} className="max-w-md whitespace-normal">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{lead.message}</p>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={lead.status === "NEW" ? "warning" : "default"}>{lead.status}</Badge>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    {lead.whatsappUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={lead.whatsappUrl} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
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
