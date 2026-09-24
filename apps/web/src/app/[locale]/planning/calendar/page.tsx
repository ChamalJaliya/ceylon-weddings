"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  duplicateAppointmentBody,
  shiftAppointmentWindow,
  type Appointment,
  type CreateAppointmentBody,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ceylonweddings/ui/components/card";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { FormPanel } from "@ceylonweddings/ui/domain/creator-form";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { Link } from "../../../../i18n/navigation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import {
  AppointmentEditor,
  KIND_COLOR,
} from "../_components/appointment-editor";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const HOUR_PX = 64;
const SNAP_MS = 15 * 60_000;
const EVENT_ALL = "__all__";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function colomboHour(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

function snapDeltaMs(deltaY: number) {
  const hours = deltaY / HOUR_PX;
  return Math.round((hours * 3_600_000) / SNAP_MS) * SNAP_MS;
}

export default function CalendarPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { data, error } = useWedding();
  const [view, setView] = useState<"week" | "month" | "day">("week");
  const [cursor, setCursor] = useState(() => startOfWeek(new Date()));
  const [focusDay, setFocusDay] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [items, setItems] = useState<Appointment[]>([]);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState(EVENT_ALL);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    startY: number;
    origin: Appointment;
    previewDelta: number;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ id: string; startsAt: string; endsAt: string } | null>(null);

  async function load() {
    const rows = await api.wedding.appointments();
    setItems(rows);
    return rows;
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const focus = searchParams.get("focus");
    const highlight = searchParams.get("highlight");
    if (focus) {
      setFocusDay(focus);
      const date = new Date(`${focus}T12:00:00`);
      if (!Number.isNaN(date.getTime())) setCursor(startOfWeek(date));
    }
    if (highlight && items.length) {
      const match = items.find((item) => item.id === highlight);
      if (match) {
        setSelected(match);
        setFocusDay(dayKey(match.startsAt));
      }
    }
  }, [searchParams, items]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(cursor);
        date.setDate(cursor.getDate() + i);
        return date;
      }),
    [cursor],
  );

  const selectedDay = days.find((day) => day.toLocaleDateString("en-CA") === focusDay) ?? days[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      if (eventFilter !== EVENT_ALL && item.eventId !== eventFilter) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, eventFilter]);

  const rail = filtered
    .filter((item) => dayKey(item.startsAt) === selectedDay.toLocaleDateString("en-CA"))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const displayItem = (item: Appointment) => {
    if (dragPreview?.id === item.id) {
      return { ...item, startsAt: dragPreview.startsAt, endsAt: dragPreview.endsAt };
    }
    return item;
  };

  if (!data) return <SignInPrompt error={error} />;

  async function onCreate(body: CreateAppointmentBody) {
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.createAppointment(body);
      await load();
      setStatus(t("knotly.appointmentSaved"));
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(body: CreateAppointmentBody) {
    if (!selected) return;
    setBusy(true);
    setStatus(null);
    try {
      const updated = await api.wedding.updateAppointment(selected.id, body);
      const rows = await load();
      setSelected(rows.find((row) => row.id === updated.id) ?? updated);
      setStatus(t("knotly.appointmentSaved"));
    } finally {
      setBusy(false);
    }
  }

  async function onDuplicate(appt: Appointment) {
    setBusy(true);
    setStatus(null);
    try {
      const created = await api.wedding.createAppointment(
        duplicateAppointmentBody(appt, { title: `${appt.title} (copy)` }),
      );
      const rows = await load();
      setSelected(rows.find((row) => row.id === created.id) ?? created);
      setStatus(t("knotly.appointmentDuplicated"));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    try {
      await api.wedding.deleteAppointment(id);
      setSelected(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function onBlockPointerDown(event: ReactPointerEvent, item: Appointment) {
    if (view !== "week" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = { id: item.id, startY: event.clientY, origin: item, previewDelta: 0 };
    setSelected(item);
  }

  function onBlockPointerMove(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.id !== (event.currentTarget as HTMLElement).dataset.apptId) return;
    const deltaMs = snapDeltaMs(event.clientY - drag.startY);
    drag.previewDelta = deltaMs;
    const shifted = shiftAppointmentWindow(drag.origin.startsAt, drag.origin.endsAt, deltaMs);
    setDragPreview({ id: drag.id, ...shifted });
  }

  async function onBlockPointerUp(event: ReactPointerEvent) {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragPreview(null);
    if (!drag || drag.previewDelta === 0) return;
    const shifted = shiftAppointmentWindow(drag.origin.startsAt, drag.origin.endsAt, drag.previewDelta);
    setBusy(true);
    try {
      const updated = await api.wedding.updateAppointment(drag.id, {
        startsAt: shifted.startsAt,
        endsAt: shifted.endsAt,
      });
      const rows = await load();
      setSelected(rows.find((row) => row.id === updated.id) ?? updated);
      setStatus(t("knotly.appointmentSaved"));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    } finally {
      setBusy(false);
    }
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <div className="grid gap-8 md:gap-10 xl:grid-cols-[1fr_20rem]">
      <div className="grid gap-4">
        <PageHeader
          icon={CalendarDays}
          title={t("nav.calendar")}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCursor(startOfWeek(new Date()))}>
                {t("knotly.today")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor(new Date(cursor.getTime() - 7 * 86400000))}
              >
                ‹
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor(new Date(cursor.getTime() + 7 * 86400000))}
              >
                ›
              </Button>
              <span className="text-sm">
                {days[0].toLocaleDateString()} – {days[6].toLocaleDateString()}
              </span>
              <div className="flex rounded-full bg-secondary p-1 text-xs">
                {(["month", "week", "day"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-full px-3 py-1 transition-colors ${view === item ? "bg-card shadow-sm" : ""}`}
                    onClick={() => setView(item)}
                  >
                    {t(`knotly.${item}`)}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        <FormPanel className="gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder={t("prefs.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SimpleSelect
              className="w-[14rem]"
              value={eventFilter}
              onValueChange={setEventFilter}
              options={[
                { value: EVENT_ALL, label: t("knotly.allEvents") },
                ...(data.events ?? []).map((event) => ({ value: event.id, label: event.name })),
              ]}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("knotly.dragHint")}</p>
          <AppointmentEditor
            mode="create"
            team={data.team ?? []}
            events={data.events ?? []}
            busy={busy}
            onSubmit={onCreate}
          />
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </FormPanel>

        <p className="text-xs text-muted-foreground">GMT+5:30</p>

        {view === "week" ? (
          <div className="overflow-auto rounded-3xl border border-border bg-card">
            <div className="grid grid-cols-8 text-xs">
              <div className="p-2" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`cursor-pointer border-l border-border p-2 font-medium ${
                    day.toLocaleDateString("en-CA") === focusDay ? "bg-secondary" : ""
                  }`}
                  onClick={() => setFocusDay(day.toLocaleDateString("en-CA"))}
                >
                  {day.toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "short" })}
                </div>
              ))}
              {HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div className="border-t border-border p-2 text-muted-foreground" style={{ minHeight: HOUR_PX }}>
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {days.map((day) => {
                    const key = day.toLocaleDateString("en-CA");
                    const blocks = filtered.filter((item) => {
                      const shown = displayItem(item);
                      return dayKey(shown.startsAt) === key && Math.floor(colomboHour(shown.startsAt)) === hour;
                    });
                    return (
                      <div
                        key={`${key}-${hour}`}
                        className="border-l border-t border-border p-1"
                        style={{ minHeight: HOUR_PX }}
                      >
                        {blocks.map((item) => {
                          const shown = displayItem(item);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              data-appt-id={item.id}
                              className="mb-1 w-full touch-none rounded-xl px-2 py-1 text-left text-[11px] select-none"
                              style={{ background: shown.color ?? KIND_COLOR[shown.kind] }}
                              onClick={() => setSelected(item)}
                              onPointerDown={(e) => onBlockPointerDown(e, item)}
                              onPointerMove={onBlockPointerMove}
                              onPointerUp={(e) => void onBlockPointerUp(e)}
                              onPointerCancel={() => {
                                dragRef.current = null;
                                setDragPreview(null);
                              }}
                            >
                              {shown.title}
                              {shown.vendorName ? (
                                <span className="mt-0.5 block truncate opacity-80">{shown.vendorName}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        ) : view === "month" ? (
          <div className="grid grid-cols-7 gap-1 rounded-3xl border border-border bg-card p-3 text-xs">
            {Array.from({ length: 42 }, (_, index) => {
              const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
              const offset = (start.getDay() + 6) % 7;
              const date = new Date(start);
              date.setDate(1 - offset + index);
              const key = date.toLocaleDateString("en-CA");
              const inMonth = date.getMonth() === cursor.getMonth();
              const dayItems = filtered.filter((item) => dayKey(item.startsAt) === key);
              return (
                <button
                  key={key + index}
                  type="button"
                  className={`min-h-20 rounded-xl p-1 text-left ${inMonth ? "bg-background" : "opacity-40"} ${
                    key === focusDay ? "ring-1 ring-primary" : ""
                  }`}
                  onClick={() => setFocusDay(key)}
                >
                  <span className="font-medium">{date.getDate()}</span>
                  {dayItems.slice(0, 2).map((item) => (
                    <span
                      key={item.id}
                      className="mt-1 block truncate rounded px-1"
                      style={{ background: item.color ?? KIND_COLOR[item.kind] }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(item);
                      }}
                    >
                      {item.title}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="grid gap-2 p-6">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-xl border border-border p-3 text-left"
                  onClick={() => setSelected(item)}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.startsAt).toLocaleString()}</p>
                  {item.vendorName ? <p className="text-xs text-muted-foreground">{item.vendorName}</p> : null}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("knotly.dayList")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rail.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-xl bg-secondary p-3 text-left text-sm"
                onClick={() => setSelected(item)}
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs">{item.kind.replaceAll("_", " ")}</p>
                {item.vendorName ? <p className="text-xs text-muted-foreground">{item.vendorName}</p> : null}
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("knotly.editAppointment")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <AppointmentEditor
                key={selected.id}
                mode="edit"
                initial={selected}
                team={data.team ?? []}
                events={data.events ?? []}
                busy={busy}
                onSubmit={onUpdate}
                onCancel={() => setSelected(null)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={() => void onDuplicate(selected)}>
                  {t("knotly.duplicate")}
                </Button>
                {selected.vendorWhatsapp ? (
                  <Button asChild>
                    <a
                      href={`https://wa.me/${selected.vendorWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("knotly.message")}
                    </a>
                  </Button>
                ) : null}
                {selected.eventId ? (
                  <Button asChild variant="outline">
                    <Link href={`/planning/agenda?eventId=${selected.eventId}&highlight=${selected.id}`}>
                      {t("knotly.openAgenda")}
                    </Link>
                  </Button>
                ) : null}
                <Button type="button" variant="outline" disabled={busy} onClick={() => void onDelete(selected.id)}>
                  {t("planning.remove")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
