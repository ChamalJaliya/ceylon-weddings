"use client";

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Appointment } from "@ceylonweddings/contracts";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { KIND_COLOR } from "@/features/planning/components/appointment-editor";
import {
  CALENDAR_START_HOUR,
  DAY_ROW_PX,
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
  pointerXToTime,
  trackWidthPx,
} from "./appointment-calendar-utils";

function hourLeftPx(hour: number) {
  return (hour - CALENDAR_START_HOUR) * HOUR_PX;
}

export type AppointmentCalendarHorizontalProps = {
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

export function AppointmentCalendarHorizontal({
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
}: AppointmentCalendarHorizontalProps) {
  const hours = buildHourMarks();
  const trackWidth = trackWidthPx();
  const nowPct = nowPositionPercent();
  const todayKey = calendarDateKey(new Date());

  return (
    <div className={cn("overflow-auto rounded-3xl border border-border bg-card", className)}>
      <div style={{ minWidth: `calc(6.5rem + ${trackWidth}px)` }}>
        <div
          className="sticky top-0 z-20 grid border-b border-border bg-card"
          style={{ gridTemplateColumns: `6.5rem ${trackWidth}px` }}
        >
          <div className="flex items-end px-2 py-2 text-label text-muted-foreground">GMT+5:30</div>
          <div className="relative border-l border-border" style={{ height: 36, width: trackWidth }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute top-0 box-border border-r border-border/70 px-1 pt-2 text-label leading-none text-muted-foreground"
                style={{ left: hourLeftPx(hour), width: HOUR_PX, height: 36 }}
              >
                {hour % 2 === 0 ? formatHourLabel(hour) : null}
              </div>
            ))}
          </div>
        </div>

        {days.map((day) => {
          const key = calendarDateKey(day);
          return (
            <div
              key={key}
              className={cn("grid border-b border-border", key === focusDay && "bg-secondary/40")}
              style={{ gridTemplateColumns: `6.5rem ${trackWidth}px` }}
            >
              <button
                type="button"
                className="px-2 py-2 text-left text-xs font-medium"
                style={{ minHeight: DAY_ROW_PX }}
                onClick={() => onFocusDay(key)}
              >
                {formatDayHeader(day)}
              </button>
              <DayRow
                day={day}
                appointments={appointments}
                preview={preview}
                trackWidth={trackWidth}
                hours={hours}
                nowPct={key === todayKey ? nowPct : null}
                onSlotClick={onSlotClick}
                onEntryClick={onEntryClick}
                onEntryMoveStart={onEntryMoveStart}
                onEntryMove={onEntryMove}
                onEntryMoveEnd={onEntryMoveEnd}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayRow({
  day,
  appointments,
  preview,
  trackWidth,
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
  trackWidth: number;
  hours: number[];
  nowPct: number | null;
  onSlotClick: (day: Date, hour: number, minute: number) => void;
  onEntryClick: (appointment: Appointment) => void;
  onEntryMoveStart?: (appointment: Appointment, event: ReactPointerEvent) => void;
  onEntryMove?: (event: ReactPointerEvent) => void;
  onEntryMoveEnd?: (event: ReactPointerEvent) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

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
    const time = pointerXToTime(day, event.clientX, rect.left, rect.width);
    const { hour, minute } = getZoneHourAndMinute(time, TZ);
    onSlotClick(day, hour, minute);
  }

  return (
    <div
      ref={trackRef}
      className="relative border-l border-border"
      style={{ height: DAY_ROW_PX, width: trackWidth }}
      onClick={handleTrackClick}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="pointer-events-none absolute inset-y-0 box-border border-r border-border/50"
          style={{ left: hourLeftPx(hour), width: HOUR_PX }}
        />
      ))}

      {nowPct != null ? (
        <div
          className="pointer-events-none absolute inset-y-0 z-20 flex flex-col items-center"
          style={{ left: `${nowPct}%` }}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-danger" />
          <span className="w-px flex-1 bg-danger" />
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
            className="absolute z-10 touch-none overflow-hidden rounded-md border-t-2 border-t-black/20 px-1.5 py-1 text-left text-label select-none shadow-sm"
            style={{
              left: style.left,
              width: style.width,
              top: `${cross.offsetPct}%`,
              height: `${cross.sizePct}%`,
              display: style.display,
              background: appointment.color ?? KIND_COLOR[appointment.kind],
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
            <span className="block truncate font-medium leading-tight">{appointment.title}</span>
            {appointment.vendorName ? (
              <span className="mt-0.5 block truncate opacity-75">{appointment.vendorName}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
