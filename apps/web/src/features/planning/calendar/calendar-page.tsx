"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Columns3, Plus, Rows3, SlidersHorizontal } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  duplicateAppointmentBody,
  shiftAppointmentWindow,
  type Appointment,
  type CreateAppointmentBody,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card, CardContent } from "@ceylonweddings/ui/components/card";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { toast } from "@ceylonweddings/ui/components/toaster";
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelContent,
  FloatingPanelFooter,
  FloatingPanelHeader,
  FloatingPanelSection,
  FloatingPanelTrigger,
} from "@ceylonweddings/ui/domain/floating-panel";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { KIND_COLOR } from "@/features/planning/components/appointment-editor";
import { AppointmentEditorModal } from "@/features/planning/components/appointment-editor-modal";
import { AppointmentCalendar } from "./appointment-calendar";
import {
  FINE_SNAP_MINUTES,
  HOUR_PX,
  type CalendarOrientation,
  calendarDateKey,
  combineDayAndTime,
  dayKeyFromIso,
  getWeekDays,
  readStoredLayout,
  startOfWeek,
  toDateTimeLocalString,
  writeStoredLayout,
} from "./appointment-calendar-utils";

const EVENT_ALL = "__all__";
const SNAP_MS = FINE_SNAP_MINUTES * 60_000;

function snapDeltaMs(deltaPx: number) {
  const hours = deltaPx / HOUR_PX;
  return Math.round((hours * 3_600_000) / SNAP_MS) * SNAP_MS;
}

export default function CalendarPage() {
  const t = useTranslations();
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const { data, error } = useWedding();
  const [view, setView] = useState<"week" | "month" | "day">("week");
  const [layout, setLayout] = useState<CalendarOrientation>("vertical");
  const [cursor, setCursor] = useState(() => startOfWeek(new Date()));
  const [focusDay, setFocusDay] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [items, setItems] = useState<Appointment[]>([]);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState(EVENT_ALL);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [createDraft, setCreateDraft] = useState<{ startsAt: string; endsAt: string } | null>(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    startPos: number;
    origin: Appointment;
    previewDelta: number;
    axis: "x" | "y";
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ id: string; startsAt: string; endsAt: string } | null>(null);

  useEffect(() => {
    setLayout(readStoredLayout());
  }, []);

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
        openEdit(match);
        setFocusDay(dayKeyFromIso(match.startsAt));
      }
    }
     
  }, [searchParams, items]);

  const days = useMemo(() => getWeekDays(cursor), [cursor]);
  const selectedDay = days.find((day) => calendarDateKey(day) === focusDay) ?? days[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      if (eventFilter !== EVENT_ALL && item.eventId !== eventFilter) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, eventFilter]);

  const rail = filtered
    .filter((item) => dayKeyFromIso(item.startsAt) === calendarDateKey(selectedDay))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  if (!data) return <SignInPrompt error={error} />;

  function changeLayout(next: CalendarOrientation) {
    setLayout(next);
    writeStoredLayout(next);
  }

  function openCreate(startsAt?: Date, endsAt?: Date) {
    const start = startsAt ?? combineDayAndTime(selectedDay, 10, 0);
    const end = endsAt ?? new Date(start.getTime() + 60 * 60_000);
    setDialogMode("create");
    setSelected(null);
    setCreateDraft({
      startsAt: toDateTimeLocalString(start),
      endsAt: toDateTimeLocalString(end),
    });
    setDialogOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setDialogMode("edit");
    setSelected(appointment);
    setCreateDraft(null);
    setDialogOpen(true);
  }

  async function onCreate(body: CreateAppointmentBody) {
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.createAppointment(body);
      await load();
      setStatus(t("knotly.appointmentSaved"));
      toast.success(t("knotly.appointmentSaved"));
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
      toast.success(t("knotly.appointmentSaved"));
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
      openEdit(rows.find((row) => row.id === created.id) ?? created);
      setStatus(t("knotly.appointmentDuplicated"));
      toast.success(t("knotly.appointmentDuplicated"));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: t("planning.remove"),
      description: "Remove this appointment from the calendar?",
      confirmLabel: t("planning.remove"),
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.wedding.deleteAppointment(id);
      setSelected(null);
      setDialogOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function onSlotClick(day: Date, hour: number, minute: number) {
    const start = combineDayAndTime(day, hour, minute);
    const end = new Date(start.getTime() + 60 * 60_000);
    setFocusDay(calendarDateKey(day));
    openCreate(start, end);
  }

  function onEntryMoveStart(item: Appointment, event: ReactPointerEvent) {
    if (view !== "week" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      id: item.id,
      startPos: layout === "horizontal" ? event.clientX : event.clientY,
      origin: item,
      previewDelta: 0,
      axis: layout === "horizontal" ? "x" : "y",
    };
  }

  function onEntryMove(event: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.id !== (event.currentTarget as HTMLElement).dataset.apptId) return;
    const pos = drag.axis === "x" ? event.clientX : event.clientY;
    const deltaMs = snapDeltaMs(pos - drag.startPos);
    drag.previewDelta = deltaMs;
    const shifted = shiftAppointmentWindow(drag.origin.startsAt, drag.origin.endsAt, deltaMs);
    setDragPreview({ id: drag.id, ...shifted });
  }

  async function onEntryMoveEnd(event: ReactPointerEvent) {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragPreview(null);
    if (!drag || drag.previewDelta === 0) {
      if (drag) openEdit(drag.origin);
      return;
    }
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

  const focusDayLabel = selectedDay.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const activeFilters = (query.trim() ? 1 : 0) + (eventFilter !== EVENT_ALL ? 1 : 0);

  return (
    <div className="grid gap-4">
      <PageHeader
        icon={CalendarDays}
        title={t("nav.calendar")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="size-4" />
              {t("knotly.add")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCursor(startOfWeek(today));
                setFocusDay(calendarDateKey(today));
                setDayPanelOpen(true);
              }}
            >
              {t("knotly.today")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getTime() - 7 * 86400000))}>
              ‹
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getTime() + 7 * 86400000))}>
              ›
            </Button>
            <span className="text-sm">
              {days[0].toLocaleDateString()} – {days[6].toLocaleDateString()}
            </span>
            <HorizontalTabs
              size="sm"
              ariaLabel="Period"
              activeId={view}
              onChange={setView}
              items={(["month", "week", "day"] as const).map((item) => ({
                id: item,
                label: t(`knotly.${item}`),
              }))}
            />
            {view === "week" ? (
              <HorizontalTabs
                size="sm"
                ariaLabel="Calendar layout"
                activeId={layout}
                onChange={changeLayout}
                items={[
                  { id: "vertical", label: "Vertical", icon: Columns3 },
                  { id: "horizontal", label: "Horizontal", icon: Rows3 },
                ]}
              />
            ) : null}
            <FloatingPanel open={dayPanelOpen} onOpenChange={setDayPanelOpen}>
              <FloatingPanelTrigger asChild>
                <Button
                  type="button"
                  shape="pill"
                  size="sm"
                  variant={dayPanelOpen || rail.length > 0 || activeFilters ? "default" : "outline"}
                >
                  <Icon icon={SlidersHorizontal} size="sm" />
                  {t("knotly.dayList")}
                  {rail.length > 0 ? (
                    <span className="grid size-5 place-items-center rounded-full bg-primary-foreground text-xs text-primary">
                      {rail.length}
                    </span>
                  ) : null}
                </Button>
              </FloatingPanelTrigger>
              <FloatingPanelContent side="right" width="22rem">
                <FloatingPanelHeader
                  icon={CalendarDays}
                  title={t("knotly.dayList")}
                  description={focusDayLabel}
                  actions={
                    activeFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setEventFilter(EVENT_ALL);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        Clear
                      </button>
                    ) : null
                  }
                />
                <FloatingPanelBody className="gap-6">
                  <FloatingPanelSection title={t("prefs.search")}>
                    <Input placeholder={t("prefs.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
                    <SimpleSelect
                      value={eventFilter}
                      onValueChange={setEventFilter}
                      options={[
                        { value: EVENT_ALL, label: t("knotly.allEvents") },
                        ...(data.events ?? []).map((event) => ({
                          value: event.id,
                          label: event.name,
                        })),
                      ]}
                    />
                  </FloatingPanelSection>
                  <FloatingPanelSection title={focusDayLabel}>
                    {rail.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No appointments this day.</p>
                    ) : (
                      <div className="grid gap-2">
                        {rail.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="rounded-xl bg-secondary p-3 text-left text-sm transition-colors hover:bg-accent"
                            onClick={() => {
                              setDayPanelOpen(false);
                              openEdit(item);
                            }}
                          >
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.startsAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              · {item.kind.replaceAll("_", " ")}
                            </p>
                            {item.vendorName ? (
                              <p className="text-xs text-muted-foreground">{item.vendorName}</p>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    )}
                    {selected?.eventId ? (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/planning/agenda?eventId=${selected.eventId}&highlight=${selected.id}`}>
                          {t("knotly.openAgenda")}
                        </Link>
                      </Button>
                    ) : null}
                  </FloatingPanelSection>
                  {status ? <FormStatus>{status}</FormStatus> : null}
                </FloatingPanelBody>
                <FloatingPanelFooter>
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl"
                    onClick={() => {
                      setDayPanelOpen(false);
                      openCreate();
                    }}
                  >
                    <Plus className="size-4" />
                    {t("knotly.add")}
                  </Button>
                </FloatingPanelFooter>
              </FloatingPanelContent>
            </FloatingPanel>
          </div>
        }
      />

      <p className="text-xs text-muted-foreground">
        {view === "week"
          ? "Click an empty slot to add · drag an event to reschedule · open Today for filters and the day list."
          : t("knotly.dragHint")}
      </p>
      {status && !dayPanelOpen ? <FormStatus>{status}</FormStatus> : null}

      {view === "week" ? (
        <AppointmentCalendar
          orientation={layout}
          days={days}
          appointments={filtered}
          focusDay={focusDay}
          preview={dragPreview}
          onFocusDay={setFocusDay}
          onSlotClick={onSlotClick}
          onEntryClick={openEdit}
          onEntryMoveStart={onEntryMoveStart}
          onEntryMove={onEntryMove}
          onEntryMoveEnd={(e) => void onEntryMoveEnd(e)}
        />
      ) : view === "month" ? (
        <div className="grid grid-cols-7 gap-1 rounded-3xl border border-border bg-card p-3 text-xs">
          {Array.from({ length: 42 }, (_, index) => {
            const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
            const offset = (start.getDay() + 6) % 7;
            const date = new Date(start);
            date.setDate(1 - offset + index);
            const key = calendarDateKey(date);
            const inMonth = date.getMonth() === cursor.getMonth();
            const dayItems = filtered.filter((item) => dayKeyFromIso(item.startsAt) === key);
            return (
              <button
                key={key + index}
                type="button"
                className={cn(
                  "min-h-20 rounded-xl p-1 text-left",
                  inMonth ? "bg-background" : "opacity-40",
                  key === focusDay && "ring-1 ring-primary",
                )}
                onClick={() => {
                  setFocusDay(key);
                  if (dayItems.length === 0) {
                    openCreate(combineDayAndTime(date, 10, 0), combineDayAndTime(date, 11, 0));
                  }
                }}
              >
                <span className="font-medium">{date.getDate()}</span>
                {dayItems.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className="mt-1 block truncate rounded px-1"
                    style={{ background: item.color ?? KIND_COLOR[item.kind] }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(item);
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
                onClick={() => openEdit(item)}
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.startsAt).toLocaleString()}</p>
                {item.vendorName ? <p className="text-xs text-muted-foreground">{item.vendorName}</p> : null}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <AppointmentEditorModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={
          dialogMode === "edit" && selected
            ? selected
            : createDraft
              ? { startsAt: createDraft.startsAt, endsAt: createDraft.endsAt }
              : undefined
        }
        team={data.team ?? []}
        events={data.events ?? []}
        busy={busy}
        onSubmit={dialogMode === "edit" ? onUpdate : onCreate}
        onDelete={selected ? () => void onDelete(selected.id) : undefined}
        onDuplicate={selected ? () => void onDuplicate(selected) : undefined}
      />
    </div>
  );
}
