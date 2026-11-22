"use client";

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Appointment } from "@ceylonweddings/contracts";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { KIND_COLOR } from "@/features/planning/components/appointment-editor";
import {
  CALENDAR_START_HOUR,
  HOUR_PX,
  TZ,
  blockStyle,
  buildHourMarks,
  calendarDateKey,
  clipAppointmentToDay,
  formatDayHeader,
  formatHourLabel,
  getZoneHourAndMinute,
  laneCrossAxisStyle,
  nowPositionPercent,
  packOverlappingLanes,
  pointerYToTime,
  trackHeightPx,
} from "./appointment-calendar-utils";

function hourTopPx(hour: number) {
  return (hour - CALENDAR_START_HOUR) * HOUR_PX;
}

export type AppointmentCalendarVerticalProps = {
  days: Date[];
  appointments: Appointment[];
  focusDay: string;
  preview?: { id: string; startsAt: string; endsAt: string } | null;
  onFocusDay: (dayKey: string) => void;
  onSlotClick: (day: Date, hour: number, minute: number) => void;
  onEntryClick: (appointment: Appointment) => void;
  onEntryMoveStart?: (appointment: Appointment, event: ReactPointerEvent) => void;
  onEntryMove?: (event: ReactPointerEvent) => void;
  onEntryMoveEnd?: (event: ReactPointerEvent) => void;
  className?: string;
};

export function AppointmentCalendarVertical({
  days,
  appointments,
  focusDay,
  preview,
  onFocusDay,
  onSlotClick,
  onEntryClick,
  onEntryMoveStart,
  onEntryMove,
  onEntryMoveEnd,
  className,
}: AppointmentCalendarVerticalProps) {
  const hours = buildHourMarks();
  const trackHeight = trackHeightPx();
  const nowPct = nowPositionPercent();
  const todayKey = calendarDateKey(new Date());

  return (
    <div className={cn("overflow-auto rounded-3xl border border-border bg-card", className)}>
      <div
        className="grid min-w-[56rem]"
        style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(5.5rem, 1fr))` }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-20 border-b border-border bg-card" />
        {days.map((day) => {
          const key = calendarDateKey(day);
          return (
            <button
              key={key}
              type="button"
              className={cn(
                "sticky top-0 z-20 border-b border-l border-border bg-card px-2 py-2.5 text-left text-xs font-medium",
                key === focusDay && "bg-secondary",
              )}
              onClick={() => onFocusDay(key)}
            >
              {formatDayHeader(day)}
            </button>
          );
        })}

        {/* Body: time gutter + day tracks share the same fixed height */}
        <div className="relative border-r border-border" style={{ height: trackHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute inset-x-0 box-border border-b border-border/70 px-1 pt-0.5 text-label leading-none text-muted-foreground"
              style={{ top: hourTopPx(hour), height: HOUR_PX }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {days.map((day) => (
          <DayColumn
            key={calendarDateKey(day)}
            day={day}
            appointments={appointments}
            preview={preview}
            trackHeight={trackHeight}
            hours={hours}
            nowPct={calendarDateKey(day) === todayKey ? nowPct : null}
            onSlotClick={onSlotClick}
            onEntryClick={onEntryClick}
            onEntryMoveStart={onEntryMoveStart}
            onEntryMove={onEntryMove}
            onEntryMoveEnd={onEntryMoveEnd}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  appointments,
  preview,
  trackHeight,
  hours,
  nowPct,
  onSlotClick,
  onEntryClick,
  onEntryMoveStart,
  onEntryMove,
  onEntryMoveEnd,
}: {
  day: Date;
  appointments: Appointment[];
  preview?: { id: string; startsAt: string; endsAt: string } | null;
  trackHeight: number;
  hours: number[];
  nowPct: number | null;
  onSlotClick: (day: Date, hour: number, minute: number) => void;
  onEntryClick: (appointment: Appointment) => void;
  onEntryMoveStart?: (appointment: Appointment, event: ReactPointerEvent) => void;
  onEntryMove?: (event: ReactPointerEvent) => void;
  onEntryMoveEnd?: (event: ReactPointerEvent) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const key = calendarDateKey(day);

  const dayItems = useMemo(() => {
    const intervals: { id: string; start: Date; end: Date; appointment: Appointment }[] = [];
    for (const item of appointments) {
      const shown = preview?.id === item.id ? { ...item, startsAt: preview.startsAt, endsAt: preview.endsAt } : item;
      const clip = clipAppointmentToDay(shown.startsAt, shown.endsAt, day);
      if (!clip) continue;
      intervals.push({ id: item.id, start: clip.start, end: clip.end, appointment: shown });
    }
    const lanes = packOverlappingLanes(intervals.map(({ id, start, end }) => ({ id, start, end })));
    return intervals.map((row) => ({ ...row, lane: lanes.get(row.id) }));
  }, [appointments, day, preview]);

  function handleTrackClick(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-appt-id]")) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const time = pointerYToTime(day, event.clientY, rect.top, rect.height);
    const { hour, minute } = getZoneHourAndMinute(time, TZ);
    onSlotClick(day, hour, minute);
  }

  return (
    <div
      ref={trackRef}
      data-day-column={key}
      className="relative border-l border-border"
      style={{ height: trackHeight }}
      onClick={handleTrackClick}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="pointer-events-none absolute inset-x-0 box-border border-b border-border/50"
          style={{ top: hourTopPx(hour), height: HOUR_PX }}
        />
      ))}

      {nowPct != null ? (
        <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: `${nowPct}%` }}>
          <span className="size-1.5 shrink-0 rounded-full bg-danger" />
          <span className="h-px flex-1 bg-danger" />
        </div>
      ) : null}

      {dayItems.map(({ id, start, end, appointment, lane }) => {
        const style = blockStyle(start, end);
        const cross = laneCrossAxisStyle(lane);
        return (
          <button
            key={id}
            type="button"
            data-appt-id={id}
            className="absolute z-10 touch-none flex flex-col justify-start overflow-hidden rounded-[6px] border-l-[3px] px-2 py-1 text-left select-none ring-1 ring-background transition hover:z-20 hover:shadow-card"
            style={{
              top: style.top,
              height: style.height,
              left: `${cross.offsetPct}%`,
              width: `${cross.sizePct}%`,
              display: style.display,
              background: `color-mix(in srgb, ${appointment.color ?? KIND_COLOR[appointment.kind]} 22%, var(--color-card))`,
              borderLeftColor: appointment.color ?? KIND_COLOR[appointment.kind],
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEntryClick(appointment);
            }}
            onPointerDown={(e) => onEntryMoveStart?.(appointment, e)}
            onPointerMove={onEntryMove}
            onPointerUp={onEntryMoveEnd}
            onPointerCancel={onEntryMoveEnd}
          >
            <span className="block truncate text-xs font-medium leading-tight text-foreground">
              {appointment.title}
            </span>
            <span className="mt-0.5 block truncate text-label leading-tight text-muted-foreground tabular-nums">
              {new Date(appointment.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {appointment.vendorName ? ` · ${appointment.vendorName}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
