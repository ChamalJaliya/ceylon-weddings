"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_TOPIC_LABELS,
  zonedTimeToUtc,
  type Consultation,
  type ConsultationMode,
  type ConsultationStatus,
  type ConsultationTopic,
  type UpdateConsultationBody,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link, useRouter } from "../../../../../i18n/navigation";

const TIMEZONE = "Asia/Colombo";

const STATUS_OPTIONS: Array<{ value: ConsultationStatus; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

function toLocalInput(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}

function fromLocalInput(value: string, timezone: string) {
  const [date, time] = value.split("T");
  const [hours, minutes] = (time ?? "00:00").split(":").map(Number);
  return zonedTimeToUtc(date ?? "", (hours ?? 0) * 60 + (minutes ?? 0), timezone).toISOString();
}

function emptyDraft() {
  const soon = new Date(Date.now() + 24 * 3_600_000);
  return {
    name: "",
    email: "",
    phone: "",
    startsAt: toLocalInput(soon.toISOString(), TIMEZONE),
    mode: "PHONE" as ConsultationMode,
    topic: "GETTING_STARTED" as ConsultationTopic,
    meetingUrl: "",
    adminNotes: "",
    message: "",
    city: "",
    weddingDate: "",
  };
}

export default function AdminConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [row, setRow] = useState<Consultation | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<ConsultationStatus>("CONFIRMED");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const next = await api.admin.consultation(params.id);
      setRow(next);
      setStatus(next.status);
      setDraft({
        name: next.name,
        email: next.email ?? "",
        phone: next.phone ?? "",
        startsAt: toLocalInput(next.startsAt, next.timezone),
        mode: next.mode,
        topic: next.topic,
        meetingUrl: next.meetingUrl ?? "",
        adminNotes: next.adminNotes ?? "",
        message: next.message ?? "",
        city: next.city ?? "",
        weddingDate: next.weddingDate ? next.weddingDate.slice(0, 10) : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [isNew, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const startsAt = fromLocalInput(draft.startsAt, TIMEZONE);
      if (isNew) {
        const created = await api.admin.createConsultation({
          startsAt,
          name: draft.name,
          email: draft.email || undefined,
          phone: draft.phone || undefined,
          mode: draft.mode,
          topic: draft.topic,
          locale: "en",
          status,
          meetingUrl: draft.meetingUrl || undefined,
          adminNotes: draft.adminNotes || undefined,
          message: draft.message || undefined,
          city: draft.city || undefined,
          weddingDate: draft.weddingDate || undefined,
          ignoreAvailability: true,
        });
        router.push(`/admin/consultations/${created.id}`);
        return;
      }
      const body: UpdateConsultationBody = {
        status,
        startsAt,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        mode: draft.mode,
        topic: draft.topic,
        meetingUrl: draft.meetingUrl,
        adminNotes: draft.adminNotes,
        message: draft.message,
        city: draft.city,
        weddingDate: draft.weddingDate || null,
      };
      setRow(await api.admin.updateConsultation(params.id, body));
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (!row || !confirm("Cancel this consultation and free the slot?")) return;
    setSaving(true);
    try {
      setRow(await api.admin.cancelConsultation(row.id, { reason: "Cancelled by the team" }));
      setStatus("CANCELLED");
      setMessage("Cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setSaving(false);
    }
  }

  if (error && !isNew && !row) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/consultations">Back</Link>
      </FormStatus>
    );
  }

  if (!isNew && !row) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={CalendarClock}
        kicker="Consultations"
        title={isNew ? "Book a consultation" : row?.name ?? "Consultation"}
        description={isNew ? "Add a call that came in by phone or WhatsApp." : row?.reference}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/consultations">Back</Link>
            </Button>
            {!isNew && row && row.status !== "CANCELLED" ? (
              <Button size="sm" variant="outline" disabled={saving} onClick={() => void cancel()}>
                Cancel booking
              </Button>
            ) : null}
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : isNew ? "Create booking" : "Save"}
            </Button>
          </div>
        }
      />
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      {message ? <FormStatus>{message}</FormStatus> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Guest" icon={CalendarClock}>
          <div className="grid gap-3">
            <Field label="Name">
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            </Field>
            <Field label="City">
              <Input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
            </Field>
            <Field label="Wedding date">
              <Input
                type="date"
                value={draft.weddingDate}
                onChange={(event) => setDraft({ ...draft, weddingDate: event.target.value })}
              />
            </Field>
            <Field label="Guest note">
              <Textarea
                rows={3}
                value={draft.message}
                onChange={(event) => setDraft({ ...draft, message: event.target.value })}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Booking" icon={CalendarClock}>
          <div className="grid gap-3">
            {!isNew && row ? (
              <div className="flex flex-wrap gap-2">
                <Badge>{row.reference}</Badge>
                <Badge>{row.status}</Badge>
                {row.assignedAdminName ? <Badge>{row.assignedAdminName}</Badge> : null}
              </div>
            ) : null}
            {!isNew ? (
              <Field label="Status">
                <SimpleSelect
                  value={status}
                  onValueChange={(value) => setStatus(value as ConsultationStatus)}
                  options={STATUS_OPTIONS}
                />
              </Field>
            ) : null}
            <Field label="Starts (Sri Lanka time)">
              <Input
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
              />
            </Field>
            <Field label="Format">
              <SimpleSelect
                value={draft.mode}
                onValueChange={(value) => setDraft({ ...draft, mode: value as ConsultationMode })}
                options={Object.entries(CONSULTATION_MODE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Topic">
              <SimpleSelect
                value={draft.topic}
                onValueChange={(value) => setDraft({ ...draft, topic: value as ConsultationTopic })}
                options={Object.entries(CONSULTATION_TOPIC_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <Field label="Meeting link">
              <Input
                value={draft.meetingUrl}
                onChange={(event) => setDraft({ ...draft, meetingUrl: event.target.value })}
                placeholder="https://meet.google.com/…"
              />
            </Field>
            <Field label="Internal notes">
              <Textarea
                rows={4}
                value={draft.adminNotes}
                onChange={(event) => setDraft({ ...draft, adminNotes: event.target.value })}
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
