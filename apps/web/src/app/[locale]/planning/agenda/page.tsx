"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  agendaForEvent,
  duplicateAppointmentBody,
  teamContactSheet,
  type Appointment,
  type AppointmentKind,
  type CreateAppointmentBody,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Label } from "@ceylonweddings/ui/components/label";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { Link } from "../../../../i18n/navigation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import {
  AppointmentEditor,
  KIND_COLOR,
} from "../_components/appointment-editor";

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

export default function AgendaPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { data, error, reload } = useWedding();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [eventId, setEventId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.wedding.appointments().then(setAppointments).catch(() => setAppointments([]));
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get("eventId");
    const highlight = searchParams.get("highlight");
    if (fromQuery) setEventId(fromQuery);
    if (highlight) {
      setHighlightId(highlight);
      setEditingId(highlight);
    }
  }, [searchParams]);

  useEffect(() => {
    if (data?.events?.length && !eventId) {
      setEventId(data.events[0]!.id);
    }
  }, [data, eventId]);

  const agenda = useMemo(
    () => (eventId ? agendaForEvent(appointments, eventId) : []),
    [appointments, eventId],
  );
  const contacts = useMemo(() => teamContactSheet(data?.team ?? []), [data?.team]);
  const canEdit = Boolean(data?.myAccess.canEditGuests || data?.myAccess.role === "COUPLE");

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`agenda-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, agenda.length]);

  if (!data) return <SignInPrompt error={error} />;

  async function refresh() {
    setAppointments(await api.wedding.appointments());
  }

  async function onAdd(body: CreateAppointmentBody) {
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.createAppointment({
        ...body,
        kind: (body.kind ?? "DAY_OF") as AppointmentKind,
        eventId,
        sortOrder: body.sortOrder ?? agenda.length,
      });
      await refresh();
      setStatus(t("knotly.appointmentSaved"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(id: string, body: CreateAppointmentBody) {
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.updateAppointment(id, { ...body, eventId });
      await refresh();
      setEditingId(null);
      setStatus(t("knotly.appointmentSaved"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onDuplicate(block: Appointment) {
    setBusy(true);
    setStatus(null);
    try {
      const created = await api.wedding.createAppointment(
        duplicateAppointmentBody(block, {
          title: `${block.title} (copy)`,
          eventId,
          sortOrder: agenda.length,
        }),
      );
      await refresh();
      setEditingId(created.id);
      setHighlightId(created.id);
      setStatus(t("knotly.appointmentDuplicated"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (!eventId) return;
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.generateNekathSchedule(eventId);
      await refresh();
      await reload();
      setStatus(t("knotly.regeneratedNekath"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const index = agenda.findIndex((row) => row.id === id);
    const swap = agenda[index + direction];
    if (!swap || index < 0) return;
    await api.wedding.updateAppointment(agenda[index]!.id, { sortOrder: swap.sortOrder ?? index + direction });
    await api.wedding.updateAppointment(swap.id, { sortOrder: agenda[index]!.sortOrder ?? index });
    await refresh();
  }

  return (
    <div className="cw-stack print:gap-4">
      <PageHeader
        icon={ClipboardList}
        kicker={t("hub.kicker")}
        title={t("nav.agenda")}
        description={t("knotly.agendaHelp")}
      />

      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="grid gap-1">
          <Label>{t("planning.events")}</Label>
          <SimpleSelect
            className="w-[16rem]"
            value={eventId}
            onValueChange={setEventId}
            options={(data.events ?? []).map((event) => ({ value: event.id, label: event.name }))}
          />
        </div>
        {data.myAccess.role === "COUPLE" ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void regenerate()}>
            {t("knotly.regenerateNekath")}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={() => window.print()}>
          {t("knotly.print")}
        </Button>
      </div>

      {contacts.length ? (
        <div className="rounded-3xl border border-border/70 p-4 print:rounded-none print:border print:p-2">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t("knotly.dayOfContacts")}
          </h2>
          <ul className="flex flex-wrap gap-3 text-sm">
            {contacts.map((contact) => (
              <li key={contact.vendorId} className="rounded-full bg-secondary px-3 py-1">
                {contact.name}
                {contact.whatsapp ? (
                  <>
                    {" · "}
                    <a
                      className="underline"
                      href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("knotly.message")}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {agenda.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("nav.agenda")}
          description={t("knotly.agendaEmpty")}
        />
      ) : (
        <ol className="grid gap-3">
          {agenda.map((block, index) => {
            const highlighted = highlightId === block.id;
            const editing = editingId === block.id;
            return (
              <li
                key={block.id}
                id={`agenda-${block.id}`}
                className={`rounded-3xl border border-border/70 px-4 py-3 ${highlighted ? "ring-2 ring-primary" : ""}`}
                style={{
                  borderLeftColor: block.color ?? KIND_COLOR[block.kind],
                  borderLeftWidth: 4,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{block.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(block.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(block.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {block.ownerLabel ? ` · ${block.ownerLabel}` : ""}
                      {block.venueName ? ` · ${block.venueName}` : ""}
                    </p>
                    {block.vendorName ? (
                      <p className="mt-1 text-sm">
                        {block.vendorName}
                        {block.vendorWhatsapp ? (
                          <>
                            {" · "}
                            <a
                              className="underline print:hidden"
                              href={`https://wa.me/${block.vendorWhatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("knotly.message")}
                            </a>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1 print:hidden">
                    <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => void move(block.id, -1)}>
                      {t("knotly.moveUp")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={index === agenda.length - 1}
                      onClick={() => void move(block.id, 1)}
                    >
                      {t("knotly.moveDown")}
                    </Button>
                    {canEdit ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(editing ? null : block.id)}
                        >
                          {editing ? t("knotly.cancel") : t("knotly.edit")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void onDuplicate(block)}>
                          {t("knotly.duplicate")}
                        </Button>
                      </>
                    ) : null}
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/planning/calendar?focus=${dayKey(block.startsAt)}&highlight=${block.id}`}>
                        {t("knotly.viewOnCalendar")}
                      </Link>
                    </Button>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={async () => {
                          await api.wedding.deleteAppointment(block.id);
                          if (editingId === block.id) setEditingId(null);
                          await refresh();
                        }}
                      >
                        {t("planning.remove")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {editing && canEdit ? (
                  <div className="mt-4 border-t border-border/60 pt-4 print:hidden">
                    <AppointmentEditor
                      key={block.id}
                      mode="edit"
                      initial={block}
                      team={data.team ?? []}
                      events={data.events ?? []}
                      showOwner
                      showEvent={false}
                      busy={busy}
                      onSubmit={(body) => onUpdate(block.id, body)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {canEdit ? (
        <div className="grid gap-3 rounded-3xl border border-border/70 p-4 print:hidden">
          <h2 className="font-medium">{t("knotly.addAgendaBlock")}</h2>
          <AppointmentEditor
            mode="create"
            initial={{ kind: "DAY_OF", eventId, color: KIND_COLOR.DAY_OF }}
            team={data.team ?? []}
            events={data.events ?? []}
            showOwner
            showEvent={false}
            busy={busy}
            submitLabel={t("knotly.add")}
            onSubmit={onAdd}
          />
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
