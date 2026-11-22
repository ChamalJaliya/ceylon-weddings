"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  MapPin,
  MessageCircle,
  Plus,
  Rows3,
  User,
} from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  duplicateAppointmentBody,
  shiftAppointmentWindow,
  type Appointment,
  type CreateAppointmentBody,
  type Task,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { Input } from "@ceylonweddings/ui/components/input";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { toast } from "@ceylonweddings/ui/components/toaster";
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

  const dueTasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of data?.tasks ?? []) {
      if (!task.dueAt || task.status === "DONE") continue;
      const key = dayKeyFromIso(task.dueAt);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [data?.tasks]);

  if (!data) return <SignInPrompt error={error} />;

  const canEdit = Boolean(data.myAccess.canEditGuests || data.myAccess.role === "COUPLE");
  const focusDueTasks = dueTasksByDay.get(focusDay) ?? [];

  function changeLayout(next: CalendarOrientation) {
    setLayout(next);
    writeStoredLayout(next);
  }

  function openCreate(startsAt?: Date, endsAt?: Date) {
    if (!canEdit) return;
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
    if (!canEdit || view !== "week" || event.button !== 0) return;
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
  function stepDay(delta: number) {
    const d = new Date(`${focusDay}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setFocusDay(calendarDateKey(d));
    setCursor(startOfWeek(d));
  }
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dayItems = filtered
    .filter((item) => dayKeyFromIso(item.startsAt) === focusDay)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const isToday = focusDay === calendarDateKey(new Date());
  const nowMs = Date.now();
  const activeFilters = (query.trim() ? 1 : 0) + (eventFilter !== EVENT_ALL ? 1 : 0);

  const dayTimeline = (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => stepDay(-1)}
            className="grid size-9 place-items-center rounded-full border border-border transition hover:border-primary/40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <p className="font-serif text-3xl leading-none">
              {isToday ? "Today" : new Date(`${focusDay}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(`${focusDay}T12:00:00`).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {dayItems.length ? ` · ${dayItems.length} ${dayItems.length === 1 ? "appointment" : "appointments"}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => stepDay(1)}
            className="grid size-9 place-items-center rounded-full border border-border transition hover:border-primary/40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        {canEdit ? (
          <Button size="sm" shape="pill" variant="outline" className="gap-1.5" onClick={() => openCreate()}>
            <Plus className="size-4" /> {t("knotly.add")}
          </Button>
        ) : null}
      </div>

      {focusDueTasks.length ? (
        <div className="mb-3 rounded-2xl border border-dashed border-border bg-secondary/40 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CheckSquare className="size-3.5" /> {t("knotly.dueTasks")}
          </p>
          <ul className="grid gap-1.5">
            {focusDueTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/planning/checklist?taskId=${task.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-background"
                >
                  <span className="truncate font-medium">{task.title}</span>
                  {task.category ? <span className="text-caption text-muted-foreground">{task.category}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dayItems.length === 0 ? (
        <button
          type="button"
          onClick={() => openCreate()}
          disabled={!canEdit}
          className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center transition hover:border-primary/40 disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </span>
          <span className="font-serif text-xl">Nothing planned</span>
          <span className="text-sm text-muted-foreground">
            {canEdit ? "Tap to add an appointment for this day." : "No appointments for this day."}
          </span>
        </button>
      ) : (
        <ol className="relative grid gap-3">
          <span aria-hidden className="absolute top-4 bottom-4 left-[5.25rem] w-px bg-border" />
          {dayItems.map((item) => {
            const color = item.color ?? KIND_COLOR[item.kind];
            const start = new Date(item.startsAt).getTime();
            const end = new Date(item.endsAt).getTime();
            const mins = Math.round((end - start) / 60000);
            const live = isToday && nowMs >= start && nowMs < end;
            const past = end < nowMs;
            return (
              <li key={item.id} className="relative grid grid-cols-[4.5rem_1fr] gap-6">
                <div className="pt-4 text-right">
                  <p className={cn("font-serif text-lg leading-none tabular-nums", past && "text-muted-foreground")}>
                    {fmtTime(item.startsAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{mins} min</p>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-5 left-[5.25rem] size-3 -translate-x-1/2 rounded-full ring-4 ring-background",
                    live && "animate-pulse",
                  )}
                  style={{ background: color }}
                />
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className={cn(
                    "rounded-3xl border border-border bg-card p-4 text-left shadow-card transition hover:border-primary/40",
                    live && "ring-2 ring-primary",
                    past && "opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="flex items-center gap-2">
                      {live ? (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                          Now
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                        <span className="size-2 rounded-full" style={{ background: color }} />
                        {item.kind.replaceAll("_", " ").toLowerCase()}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {fmtTime(item.startsAt)} – {fmtTime(item.endsAt)}
                    </span>
                    {item.venueName ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {item.venueName}
                      </span>
                    ) : null}
                    {item.ownerLabel ? (
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3.5" /> {item.ownerLabel}
                      </span>
                    ) : null}
                  </p>
                  {item.vendorName ? (
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                      {item.vendorName}
                      {item.vendorWhatsapp ? (
                        <a
                          href={`https://wa.me/${item.vendorWhatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-primary"
                        >
                          <MessageCircle className="size-3.5" /> {t("knotly.message")}
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );

  return (
    <div className="grid gap-4">
      <PageHeader
        icon={CalendarDays}
        title={t("nav.calendar")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCursor(startOfWeek(today));
                setFocusDay(calendarDateKey(today));
                setView("day");
              }}
            >
              {t("knotly.today")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (view === "day" ? stepDay(-1) : setCursor(new Date(cursor.getTime() - 7 * 86400000)))}
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (view === "day" ? stepDay(1) : setCursor(new Date(cursor.getTime() + 7 * 86400000)))}
            >
              ›
            </Button>
            <span className="text-sm">
              {view === "day" ? focusDayLabel : `${days[0].toLocaleDateString()} – ${days[6].toLocaleDateString()}`}
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
            <Input
              className="h-9 w-44"
              placeholder={t("prefs.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Combobox
              aria-label={t("knotly.allEvents")}
              className="h-9 w-48"
              value={eventFilter}
              onValueChange={setEventFilter}
              searchPlaceholder="Search events…"
              options={[
                { value: EVENT_ALL, label: t("knotly.allEvents") },
                ...(data.events ?? []).map((event) => ({ value: event.id, label: event.name })),
              ]}
            />
            {activeFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setEventFilter(EVENT_ALL);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        }
      />

      <p className="text-xs text-muted-foreground">
        {view === "week"
          ? "Click an empty slot to add · drag an event to reschedule · click a day to see its timeline above."
          : t("knotly.dragHint")}
      </p>
      {status ? <FormStatus>{status}</FormStatus> : null}

      <div className="grid gap-6">
        {dayTimeline}
        <div className={cn("min-w-0", view === "day" && "hidden")}>
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
                const dayDue = dueTasksByDay.get(key) ?? [];
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
                      if (dayItems.length === 0 && canEdit) {
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
                    {dayDue.length ? (
                      <span className="mt-1 block truncate rounded border border-dashed border-border px-1 text-label text-muted-foreground">
                        {dayDue.length} {t("knotly.dueTasks").toLowerCase()}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

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
        canEdit={canEdit}
        onSubmit={dialogMode === "edit" ? onUpdate : onCreate}
        onDelete={selected ? () => void onDelete(selected.id) : undefined}
        onDuplicate={selected ? () => void onDuplicate(selected) : undefined}
        onAddPrepTask={
          selected
            ? () => {
                void (async () => {
                  setBusy(true);
                  try {
                    await api.wedding.createTask({
                      title: `Prep: ${selected.title}`,
                      category: "schedule",
                      dueAt: selected.startsAt,
                      appointmentId: selected.id,
                      status: "TODO",
                    });
                    toast.success(t("knotly.prepTaskCreated"));
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
                  } finally {
                    setBusy(false);
                  }
                })();
              }
            : undefined
        }
      />
    </div>
  );
}
