"use client";

import { cn } from "../../lib/utils";
import type { WidgetDefinition } from "./types";

/** Neutral skeleton line used inside previews. */
function Line({ className }: { className?: string }) {
  return <span className={cn("block h-1.5 rounded-full bg-muted-foreground/15", className)} />;
}

function StatPreview({ widget }: { widget: WidgetDefinition }) {
  const Glyph = widget.icon;
  return (
    <div className="flex size-full flex-col justify-between p-2.5">
      <div className="flex items-start justify-between">
        <div className="grid gap-1">
          <Line className="w-8" />
          <Line className="w-5" />
        </div>
        <Glyph className="size-3 text-primary" aria-hidden />
      </div>
      <div className="flex items-center gap-1">
        <span className="block h-2.5 w-7 rounded-sm bg-foreground/70" />
        <span className="block h-1.5 w-3.5 rounded-full bg-success" />
      </div>
    </div>
  );
}

function AreaPreview() {
  return (
    <div className="flex size-full flex-col justify-between p-2.5">
      <Line className="w-8" />
      <svg viewBox="0 0 60 28" className="w-full text-primary" aria-hidden>
        <path
          d="M0 22 L10 18 L18 20 L26 10 L34 14 L44 6 L52 9 L60 3 L60 28 L0 28 Z"
          fill="currentColor"
          fillOpacity="0.18"
        />
        <path
          d="M0 22 L10 18 L18 20 L26 10 L34 14 L44 6 L52 9 L60 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function BarsPreview() {
  return (
    <div className="flex size-full items-end justify-center gap-1.5 pb-3">
      {["h-5", "h-9", "h-7", "h-11"].map((h, i) => (
        <span
          key={i}
          className={cn("block w-2.5 rounded-t-sm", h, i === 3 ? "bg-primary" : "bg-muted-foreground/20")}
        />
      ))}
    </div>
  );
}

function DonutPreview() {
  const segments = [
    { len: 50, offset: 0, tone: "chart-tone-1" },
    { len: 22, offset: -53, tone: "chart-tone-2" },
    { len: 14, offset: -78, tone: "chart-tone-4" },
  ];
  return (
    <div className="flex size-full items-center justify-center">
      <svg viewBox="0 0 40 40" className="size-14 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r="15" fill="none" strokeWidth="5" className="stroke-muted" />
        {segments.map((s) => (
          <circle
            key={s.tone}
            cx="20"
            cy="20"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeDasharray={`${s.len} 94.25`}
            strokeDashoffset={s.offset}
            className={s.tone}
          />
        ))}
      </svg>
    </div>
  );
}

function RingPreview() {
  return (
    <div className="flex size-full items-center justify-center">
      <svg viewBox="0 0 40 40" className="size-14 -rotate-90 text-primary" aria-hidden>
        <circle cx="20" cy="20" r="15" fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="66 94.25"
        />
      </svg>
    </div>
  );
}

function ListPreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-2 p-2.5">
      <Line className="w-9 bg-muted-foreground/25" />
      {["chart-tone-1", "chart-tone-2", "chart-tone-4"].map((tone, i) => (
        <div key={tone} className="flex items-center gap-1.5">
          <span className={cn("block size-1.5 shrink-0 rounded-full bg-current", tone)} />
          <Line className={i === 1 ? "w-6" : "w-8"} />
          <Line className="ml-auto w-2.5" />
        </div>
      ))}
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-2 p-2.5">
      {[
        ["w-4/5", "bg-primary"],
        ["w-1/2", "bg-success"],
        ["w-11/12", "bg-warning"],
      ].map(([w, bg]) => (
        <div key={bg} className="grid gap-1">
          <Line className="w-6" />
          <div className="h-1.5 w-full rounded-full bg-muted">
            <span className={cn("block h-full rounded-full", w, bg)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaPreview() {
  return (
    <div className="flex size-full flex-col gap-1 p-1.5">
      <span className="block flex-1 rounded-md bg-gradient-to-br from-chart-1/40 via-chart-4/25 to-chart-3/30" />
      <Line className="w-10" />
    </div>
  );
}

function CalendarPreview() {
  return (
    <div className="grid size-full grid-cols-4 content-center gap-1 p-2.5">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={cn("block aspect-square rounded-sm", i === 6 ? "bg-primary" : "bg-muted-foreground/15")}
        />
      ))}
    </div>
  );
}

/** Small picture of what a widget looks like, for the catalog. */
export function WidgetPreview({ widget, active = false }: { widget: WidgetDefinition; active?: boolean }) {
  return (
    <div
      aria-hidden
      data-preview-kind={widget.preview}
      className={cn(
        "flex size-24 shrink-0 items-center justify-center rounded-2xl p-2.5 transition-colors duration-300",
        active ? "bg-primary/10 ring-1 ring-primary/25" : "bg-muted/70",
      )}
    >
      <div className="flex size-18 items-center justify-center overflow-hidden rounded-xl bg-card shadow-sm transition-transform duration-300 group-hover/widget-card:-translate-y-0.5 group-hover/widget-card:scale-[1.03]">
        {widget.preview === "stat" ? <StatPreview widget={widget} /> : null}
        {widget.preview === "area" ? <AreaPreview /> : null}
        {widget.preview === "bars" ? <BarsPreview /> : null}
        {widget.preview === "donut" ? <DonutPreview /> : null}
        {widget.preview === "ring" ? <RingPreview /> : null}
        {widget.preview === "list" ? <ListPreview /> : null}
        {widget.preview === "progress" ? <ProgressPreview /> : null}
        {widget.preview === "media" ? <MediaPreview /> : null}
        {widget.preview === "calendar" ? <CalendarPreview /> : null}
      </div>
    </div>
  );
}
