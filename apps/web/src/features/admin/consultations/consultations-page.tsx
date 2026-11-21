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
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, serverSourceCount, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const STATUS_INTENT: Record<ConsultationStatus, "info" | "success" | "danger" | "warning" | undefined> = {
  PENDING: "info",
  CONFIRMED: "success",
  COMPLETED: undefined,
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

const BOOKING_COLUMNS = ["when", "guest", "topic", "status", "actions"] as const;
const INBOX_COLUMNS = ["from", "message", "status", "actions"] as const;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = `${q}|${status}|${mode}|${range}`;

  const load = useCallback(async () => {
    try {
      setLoading(true);
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status, mode, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    filtered,
    25,
    filterKey,
  );
  const isDefaultView = !q && !status && !mode;
  const sourceCount = serverSourceCount(rows.length, isDefaultView);
  const emptyMode = getListEmptyMode({ sourceCount, filteredCount: filtered.length });
  const chrome = showListChrome(emptyMode, loading);

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
        <ContactInbox rows={messages} loading={loading} onChanged={load} />
      ) : (
        <SectionCard title="Bookings" icon={CalendarClock}>
          {chrome ? (
            <AdminListToolbar
              searchValue={q}
              onSearchChange={setQ}
              searchPlaceholder="Search name, email, phone, ref…"
              summary={loading ? "Loading…" : `${total} booking${total === 1 ? "" : "s"}`}
              filters={
                <div className="flex flex-wrap gap-2">
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
              }
            />
          ) : null}
          <DataTableList
            framed={false}
            loading={loading}
            loadingColumns={BOOKING_COLUMNS.length}
            sourceCount={sourceCount}
            filteredCount={filtered.length}
            empty={{
              icon: CalendarClock,
              title: "No consultations",
              description: "Bookings from /consultation will appear here.",
            }}
            filteredEmpty={{
              onClearFilters: () => {
                setQ("");
                setStatus("");
                setMode("");
                setRange("upcoming");
              },
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
            getRowId={(row) => row.id}
            orderedVisibleIds={BOOKING_COLUMNS}
            renderHead={(id) => {
              const labels: Record<(typeof BOOKING_COLUMNS)[number], string> = {
                when: "When",
                guest: "Guest",
                topic: "Topic",
                status: "Status",
                actions: "",
              };
              return <DataTableHead key={id}>{labels[id as (typeof BOOKING_COLUMNS)[number]]}</DataTableHead>;
            }}
            renderCell={(id, row) => {
              switch (id) {
                case "when":
                  return (
                    <DataTableCell key={id}>
                      <p className="font-medium">{formatWhen(row.startsAt, row.timezone)}</p>
                      <p className="text-xs text-muted-foreground">
                        {CONSULTATION_MODE_LABELS[row.mode]} · {row.reference}
                      </p>
                    </DataTableCell>
                  );
                case "guest":
                  return (
                    <DataTableCell key={id}>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[row.email, row.phone].filter(Boolean).join(" · ")}
                      </p>
                    </DataTableCell>
                  );
                case "topic":
                  return (
                    <DataTableCell key={id} className="text-sm">
                      {CONSULTATION_TOPIC_LABELS[row.topic]}
                    </DataTableCell>
                  );
                case "status":
                  return (
                    <DataTableCell key={id}>
                      <Badge intent={STATUS_INTENT[row.status]}>{row.status}</Badge>
                    </DataTableCell>
                  );
                case "actions":
                  return (
                    <DataTableCell key={id}>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/consultations/${row.id}`}>Open</Link>
                      </Button>
                    </DataTableCell>
                  );
                default:
                  return null;
              }
            }}
          />
        </SectionCard>
      )}
    </div>
  );
}

function ContactInbox({
  rows,
  loading,
  onChanged,
}: {
  rows: ContactMessage[];
  loading: boolean;
  onChanged: () => Promise<void>;
}) {
  const filtered = rows;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, "");

  return (
    <SectionCard title="Contact inbox" icon={CalendarClock}>
      <DataTableList
        framed={false}
        loading={loading}
        loadingColumns={INBOX_COLUMNS.length}
        sourceCount={rows.length}
        filteredCount={filtered.length}
        empty={{
          icon: CalendarClock,
          title: "No messages",
          description: "The public contact form will land here.",
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
        getRowId={(row) => row.id}
        orderedVisibleIds={INBOX_COLUMNS}
        renderHead={(id) => {
          const labels: Record<(typeof INBOX_COLUMNS)[number], string> = {
            from: "From",
            message: "Message",
            status: "Status",
            actions: "",
          };
          return <DataTableHead key={id}>{labels[id as (typeof INBOX_COLUMNS)[number]]}</DataTableHead>;
        }}
        renderCell={(id, row) => {
          switch (id) {
            case "from":
              return (
                <DataTableCell key={id}>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{[row.email, row.phone].filter(Boolean).join(" · ")}</p>
                </DataTableCell>
              );
            case "message":
              return (
                <DataTableCell key={id}>
                  <p className="line-clamp-3 text-sm">{row.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(row.createdAt))}
                  </p>
                </DataTableCell>
              );
            case "status":
              return (
                <DataTableCell key={id}>
                  <Badge intent={row.status === "NEW" ? "info" : row.status === "CLOSED" ? undefined : "success"}>
                    {row.status}
                  </Badge>
                </DataTableCell>
              );
            case "actions":
              return (
                <DataTableCell key={id}>
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
                </DataTableCell>
              );
            default:
              return null;
          }
        }}
      />
    </SectionCard>
  );
}
