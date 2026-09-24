"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { buttonVariants } from "../contracts/button";
import { Icon } from "./icon";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3.5", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "grid gap-3",
        month_caption: "relative flex h-10 items-center justify-center px-10",
        caption_label: "font-serif text-[15px] font-semibold tracking-tight",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase",
        week: "mt-1 flex w-full",
        day: "relative p-0 text-center text-sm",
        day_button: cn(
          "size-9 rounded-full p-0 font-normal transition-colors",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          "aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:shadow-sm",
        today: "[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-accent-foreground",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        range_middle: "[&>button]:rounded-none [&>button]:bg-primary/12 [&>button]:text-foreground",
        range_start: "[&>button]:rounded-l-full",
        range_end: "[&>button]:rounded-r-full",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <Icon icon={orientation === "left" ? ChevronLeft : ChevronRight} size="sm" />
        ),
      }}
      {...props}
    />
  );
}
