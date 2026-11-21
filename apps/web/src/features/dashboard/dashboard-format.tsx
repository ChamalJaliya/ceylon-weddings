"use client";

import type { ReactNode } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DailyPoint } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";

/** "21 Nov" for a YYYY-MM-DD calendar day. */
export function shortDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export const values = (series: DailyPoint[]) => series.map((point) => point.value);
export const days = (series: DailyPoint[]) => series.map((point) => point.date);

/** Last `n` points (KPI sparklines read better over two weeks than thirty days). */
export const tail = (series: DailyPoint[], n = 14) => values(series).slice(-n);

export const count = (n: number) => n.toLocaleString("en-LK");

/** Toolbar read-out: what the numbers cover and a refresh. */
export function DashboardToolbar({
  label,
  updatedAt,
  refreshing,
  onRefresh,
}: {
  label: string;
  updatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
      <span className="rounded-full border border-border/70 bg-card px-3 py-1 font-medium text-foreground">
        {label}
      </span>
      {updatedAt ? (
        <span>
          Updated{" "}
          {updatedAt.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" })}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh dashboard"
      >
        <RefreshCw className={refreshing ? "size-3.5 motion-safe:animate-spin" : "size-3.5"} aria-hidden />
      </Button>
    </div>
  );
}

/** Quiet "View all →" link for a widget's title row. */
export function WidgetHeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="widget__link">
      {children}
      <ArrowRight className="size-3" aria-hidden />
    </Link>
  );
}
