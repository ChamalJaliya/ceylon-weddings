"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Inquiry } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../i18n/navigation";

export default function LeadsPage() {
  const [leads, setLeads] = useState<(Inquiry & { wedding: { partnerOneName: string; partnerTwoName: string } })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vendors.leads().then(setLeads).catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="cw-stack">
      <PageHeader
        icon={Briefcase}
        kicker="Pro"
        title="Leads"
        description="Inquiries with a WhatsApp deep link."
      />
      <SectionCard title="Inbox" icon={Briefcase} variant="muted">
        {leads.length === 0 ? (
          <EmptyState icon={Briefcase} title="No inquiries yet" description="When couples reach out, they will appear here." />
        ) : (
          <div className="grid gap-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="cw-row-lift grid gap-2 rounded-xl border border-border/70 bg-background/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {lead.wedding.partnerOneName} & {lead.wedding.partnerTwoName}
                  </p>
                  <Badge intent={lead.status === "NEW" ? "warning" : "default"}>{lead.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{lead.message}</p>
                {lead.whatsappUrl ? (
                  <Button asChild size="sm" variant="outline" className="w-fit">
                    <a href={lead.whatsappUrl} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
