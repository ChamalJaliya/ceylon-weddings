"use client";

import type { Appointment } from "@ceylonweddings/contracts";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CalendarOrientation } from "./appointment-calendar-utils";
import { AppointmentCalendarHorizontal } from "./appointment-calendar-horizontal";
import { AppointmentCalendarVertical } from "./appointment-calendar-vertical";

export type AppointmentCalendarProps = {
  orientation?: CalendarOrientation;
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

/** Orientation router — vertical = hours down; horizontal = hours across (Kloqra pattern). */
export function AppointmentCalendar({ orientation = "vertical", ...props }: AppointmentCalendarProps) {
  if (orientation === "horizontal") {
    return <AppointmentCalendarHorizontal {...props} />;
  }
  return <AppointmentCalendarVertical {...props} />;
}
