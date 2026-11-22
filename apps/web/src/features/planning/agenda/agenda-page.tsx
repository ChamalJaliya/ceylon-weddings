"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
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
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { cn } from "@ceylonweddings/ui/utils";
import { PlanningHero, heroButtonClass, heroSelectClass } from "@/features/planning/components/planning-hero";
import { Link } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { AppointmentEditor, KIND_COLOR } from "@/features/planning/components/appointment-editor";

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
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.wedding
      .appointments()
      .then(setAppointments)
      .catch(() => setAppointments([]));
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

  const agenda = useMemo(() => (eventId ? agendaForEvent(appointments, eventId) : []), [appointments, eventId]);
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

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const event = (data.events ?? []).find((e) => e.id === eventId);
  const first = agenda[0];
  const last = agenda[agenda.length - 1];
  const spanMins =
    first && last ? Math.round((new Date(last.endsAt).getTime() - new Date(first.startsAt).getTime()) / 60000) : 0;
  const spanLabel =
    spanMins >= 60 ? `${Math.floor(spanMins / 60)}h${spanMins % 60 ? ` ${spanMins % 60}m` : ""}` : `${spanMins}m`;
  const iconBtn =
    "grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="cw-stack print:gap-4">
      <PlanningHero
        icon={ClipboardList}
        kicker={t("hub.kicker")}
        title={t("nav.agenda")}
        description={t("knotly.agendaHelp")}
        actions={
          <>
            {data.myAccess.role === "COUPLE" ? (
              <Button
                type="button"
                variant="outline"
                shape="pill"
                size="sm"
                className={heroButtonClass}
                disabled={busy}
                onClick={() => void regenerate()}
              >
                <Sparkles className="size-4" /> {t("knotly.regenerateNekath")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              shape="pill"
              size="sm"
              className={heroButtonClass}
              onClick={() => window.print()}
            >
              <Printer className="size-4" /> {t("knotly.print")}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="grid gap-1.5 print:hidden">
            <span className="text-xs text-paper/60">{t("planning.events")}</span>
            <Combobox
              aria-label={t("planning.events")}
              className={cn("w-64", heroSelectClass)}
              value={eventId}
              onValueChange={setEventId}
              searchPlaceholder="Search events…"
              options={(data.events ?? []).map((e) => ({ value: e.id, label: e.name }))}
            />
          </div>
          <p className="hidden font-serif text-2xl print:block">{event?.name}</p>
          {first && last ? (
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-paper/60 print:text-muted-foreground">Runs</p>
                <p className="font-serif text-2xl">
                  {fmtTime(first.startsAt)} – {fmtTime(last.endsAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-paper/60 print:text-muted-foreground">Length</p>
                <p className="font-serif text-2xl">{spanLabel}</p>
              </div>
              <div>
                <p className="text-xs text-paper/60 print:text-muted-foreground">Moments</p>
                <p className="font-serif text-2xl">{agenda.length}</p>
              </div>
            </div>
          ) : null}
        </div>
      </PlanningHero>

      {contacts.length ? (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-card print:rounded-none print:shadow-none">
          <p className="mb-3 text-label tracking-eyebrow text-muted-foreground uppercase">
            {t("knotly.dayOfContacts")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {contacts.map((contact) => (
              <li
                key={contact.vendorId}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pr-1 pl-1"
              >
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {contact.name.charAt(0)}
                </span>
                <span className="text-sm">{contact.name}</span>
                {contact.whatsapp ? (
                  <a
                    className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 print:hidden"
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t("knotly.message")} ${contact.name}`}
                  >
                    <MessageCircle className="size-3.5" />
                  </a>
                ) : (
                  <span className="pr-2" />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {agenda.length === 0 ? (
        <div className="grid place-items-center gap-4 rounded-3xl border border-dashed border-border p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="size-6" />
          </span>
          <div>
            <p className="font-serif text-2xl">No run sheet yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("knotly.agendaEmpty")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {data.myAccess.role === "COUPLE" ? (
              <Button shape="pill" className="gap-2" disabled={busy} onClick={() => void regenerate()}>
                <Sparkles className="size-4" /> {t("knotly.regenerateNekath")}
              </Button>
            ) : null}
            {canEdit ? (
              <Button shape="pill" variant="outline" className="gap-2" onClick={() => setAdding(true)}>
                <Plus className="size-4" /> {t("knotly.addAgendaBlock")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <ol className="relative grid gap-3">
          <span aria-hidden className="absolute top-4 bottom-4 left-[5.25rem] w-px bg-border sm:left-[6.25rem]" />
          {agenda.map((block, index) => {
            const highlighted = highlightId === block.id;
            const editing = editingId === block.id;
            const color = block.color ?? KIND_COLOR[block.kind];
            const mins = Math.round((new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000);
            return (
              <li
                key={block.id}
                id={`agenda-${block.id}`}
                className="group relative grid grid-cols-[4.5rem_1fr] gap-6 sm:grid-cols-[5.5rem_1fr]"
              >
                <div className="pt-4 text-right">
                  <p className="font-serif text-lg leading-none tabular-nums">{fmtTime(block.startsAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{mins} min</p>
                </div>
                <span
                  aria-hidden
                  className="absolute top-5 left-[5.25rem] size-3 -translate-x-1/2 rounded-full ring-4 ring-background sm:left-[6.25rem]"
                  style={{ background: color }}
                />
                <div
                  className={cn(
                    "rounded-3xl border border-border bg-card p-4 shadow-card transition print:rounded-none print:shadow-none",
                    highlighted && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{block.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" /> {fmtTime(block.startsAt)} – {fmtTime(block.endsAt)}
                        </span>
                        {block.venueName ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" /> {block.venueName}
                          </span>
                        ) : null}
                        {block.ownerLabel ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="size-3.5" /> {block.ownerLabel}
                          </span>
                        ) : null}
                      </p>
                      {block.vendorName ? (
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                          {block.vendorName}
                          {block.vendorWhatsapp ? (
                            <a
                              className="inline-flex items-center gap-1 text-primary print:hidden"
                              href={`https://wa.me/${block.vendorWhatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="size-3.5" /> {t("knotly.message")}
                            </a>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100 focus-within:opacity-100 print:hidden">
                      {canEdit ? (
                        <>
                          <button
                            type="button"
                            className={iconBtn}
                            aria-label={t("knotly.moveUp")}
                            title={t("knotly.moveUp")}
                            disabled={index === 0}
                            onClick={() => void move(block.id, -1)}
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            aria-label={t("knotly.moveDown")}
                            title={t("knotly.moveDown")}
                            disabled={index === agenda.length - 1}
                            onClick={() => void move(block.id, 1)}
                          >
                            <ArrowDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            className={cn(iconBtn, editing && "bg-secondary text-foreground")}
                            aria-label={t("knotly.edit")}
                            title={t("knotly.edit")}
                            onClick={() => setEditingId(editing ? null : block.id)}
                          >
                            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            aria-label={t("knotly.duplicate")}
                            title={t("knotly.duplicate")}
                            disabled={busy}
                            onClick={() => void onDuplicate(block)}
                          >
                            <Copy className="size-4" />
                          </button>
                        </>
                      ) : null}
                      <Link
                        href={`/planning/calendar?focus=${dayKey(block.startsAt)}&highlight=${block.id}`}
                        className={iconBtn}
                        aria-label={t("knotly.viewOnCalendar")}
                        title={t("knotly.viewOnCalendar")}
                      >
                        <CalendarDays className="size-4" />
                      </Link>
                      {canEdit ? (
                        <button
                          type="button"
                          className={iconBtn}
                          aria-label={t("knotly.addPrepTask")}
                          title={t("knotly.addPrepTask")}
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await api.wedding.createTask({
                                title: `Prep: ${block.title}`,
                                category: "schedule",
                                dueAt: block.startsAt,
                                appointmentId: block.id,
                                status: "TODO",
                              });
                              toast.success(t("knotly.prepTaskCreated"));
                              await reload();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <CheckSquare className="size-4" />
                        </button>
                      ) : null}
                      {canEdit ? (
                        <button
                          type="button"
                          className={cn(iconBtn, "hover:bg-destructive/10 hover:text-destructive")}
                          aria-label={t("planning.remove")}
                          title={t("planning.remove")}
                          disabled={busy}
                          onClick={async () => {
                            await api.wedding.deleteAppointment(block.id);
                            if (editingId === block.id) setEditingId(null);
                            await refresh();
                          }}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {editing && canEdit ? (
                    <div className="mt-4 border-t border-border pt-4 print:hidden">
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
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canEdit ? (
        adding ? (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-card print:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-xl">{t("knotly.addAgendaBlock")}</p>
              <button
                type="button"
                className={iconBtn}
                aria-label={t("knotly.cancel")}
                onClick={() => setAdding(false)}
              >
                <X className="size-4" />
              </button>
            </div>
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
            {status ? <FormStatus>{status}</FormStatus> : null}
          </section>
        ) : agenda.length ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-border p-4 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary print:hidden"
          >
            <Plus className="size-4" /> {t("knotly.addAgendaBlock")}
          </button>
        ) : null
      ) : null}
      {status && !adding ? <FormStatus className="print:hidden">{status}</FormStatus> : null}
    </div>
  );
}
