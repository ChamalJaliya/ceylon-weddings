"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_TOPIC_LABELS,
  type Consultation,
  type ConsultationListQuery,
  type ConsultationMode,
  type ConsultationStatus,
  type ContactMessage,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

const STATUS_INTENT: Record<ConsultationStatus, "info" | "success" | "danger" | "warning" | undefined> = {
  PENDING: "info",
  CONFIRMED: "success",
  COMPLETED: undefined,
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

function formatWhen(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h12",
  }).format(new Date(iso));
}

export default function AdminConsultationsPage() {
  const [tab, setTab] = useState<"bookings" | "inbox">("bookings");
  const [rows, setRows] = useState<Consultation[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [summary, setSummary] = useState({ pending: 0, upcoming: 0 });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [mode, setMode] = useState<string>("");
  const [range, setRange] = useState<NonNullable<ConsultationListQuery["window"]>>("upcoming");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query: ConsultationListQuery = {
        q: q || undefined,
        status: (status || undefined) as ConsultationStatus | undefined,
        mode: (mode || undefined) as ConsultationMode | undefined,
        window: range,
      };
      const [next, counts, inbox] = await Promise.all([
        api.admin.consultations(query),
        api.admin.consultationSummary(),
        api.admin.contactMessages(),
      ]);
      setRows(next);
      setSummary(counts);
      setMessages(inbox);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [q, status, mode, range]);

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
        icon={CalendarClock}
        kicker="Support"
        title="Consultations"
        description="Platform calls booked by guests. Confirm, add a meeting link, or free a slot."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings/consultations">Availability</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/consultations/new">Book for someone</Link>
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        {summary.upcoming} upcoming · {summary.pending} awaiting confirmation ·{" "}
        {messages.filter((item) => item.status === "NEW").length} new messages
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "bookings" ? "default" : "outline"} onClick={() => setTab("bookings")}>
          Bookings
        </Button>
        <Button size="sm" variant={tab === "inbox" ? "default" : "outline"} onClick={() => setTab("inbox")}>
          Inbox
        </Button>
      </div>

      {tab === "inbox" ? (
        <ContactInbox rows={messages} onChanged={load} />
      ) : (
      <SectionCard title="Bookings" icon={CalendarClock}>
        <div className="mb-4 grid gap-2 sm:grid-cols-4">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email, phone, ref…" />
          <SimpleSelect
            value={range}
            onValueChange={(value) => setRange(value as NonNullable<ConsultationListQuery["window"]>)}
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
              { value: "all", label: "All" },
            ]}
          />
          <SimpleSelect
            value={status || "all"}
            onValueChange={(value) => setStatus(value === "all" ? "" : value)}
            options={[
              { value: "all", label: "Any status" },
              { value: "PENDING", label: "Pending" },
              { value: "CONFIRMED", label: "Confirmed" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "NO_SHOW", label: "No-show" },
            ]}
          />
          <SimpleSelect
            value={mode || "all"}
            onValueChange={(value) => setMode(value === "all" ? "" : value)}
            options={[
              { value: "all", label: "Any format" },
              ...Object.entries(CONSULTATION_MODE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No consultations"
            description="Bookings from /consultation will appear here."
          />
        ) : (
          <AdminDataTable headers={["When", "Guest", "Topic", "Status", ""]}>
            {rows.map((row) => (
              <AdminDataRow key={row.id}>
                <AdminDataCell>
                  <p className="font-medium">{formatWhen(row.startsAt, row.timezone)}</p>
                  <p className="text-xs text-muted-foreground">
                    {CONSULTATION_MODE_LABELS[row.mode]} · {row.reference}
                  </p>
                </AdminDataCell>
                <AdminDataCell>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{[row.email, row.phone].filter(Boolean).join(" · ")}</p>
                </AdminDataCell>
                <AdminDataCell className="text-sm">{CONSULTATION_TOPIC_LABELS[row.topic]}</AdminDataCell>
                <AdminDataCell>
                  <Badge intent={STATUS_INTENT[row.status]}>{row.status}</Badge>
                </AdminDataCell>
                <AdminDataCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/consultations/${row.id}`}>Open</Link>
                  </Button>
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
      )}
    </div>
  );
}

function ContactInbox({
  rows,
  onChanged,
}: {
  rows: ContactMessage[];
  onChanged: () => Promise<void>;
}) {
  return (
    <SectionCard title="Contact inbox" icon={CalendarClock}>
      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No messages" description="The public contact form will land here." />
      ) : (
        <AdminDataTable headers={["From", "Message", "Status", ""]}>
          {rows.map((row) => (
            <AdminDataRow key={row.id}>
              <AdminDataCell>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[row.email, row.phone].filter(Boolean).join(" · ")}
                </p>
              </AdminDataCell>
              <AdminDataCell>
                <p className="line-clamp-3 text-sm">{row.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(row.createdAt))}
                </p>
              </AdminDataCell>
              <AdminDataCell>
                <Badge intent={row.status === "NEW" ? "info" : row.status === "CLOSED" ? undefined : "success"}>
                  {row.status}
                </Badge>
              </AdminDataCell>
              <AdminDataCell>
                <div className="flex flex-wrap gap-1">
                  {row.status === "NEW" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.admin.updateContactMessage(row.id, { status: "READ" });
                        await onChanged();
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                  {row.status !== "CLOSED" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await api.admin.updateContactMessage(row.id, { status: "CLOSED" });
                        await onChanged();
                      }}
                    >
                      Close
                    </Button>
                  ) : null}
                </div>
              </AdminDataCell>
            </AdminDataRow>
          ))}
        </AdminDataTable>
      )}
    </SectionCard>
  );
}
