"use client";

import { useId, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Icon, type IconComponent } from "../../components/icon";
import { cn } from "../../lib/utils";
import { WidgetInfoTooltip } from "./widget-shell";

export type KpiTone = "primary" | "success" | "warning" | "danger" | "info" | "love" | "premium";
export type KpiStatus = { label: string; tone?: "success" | "warning" | "danger" | "info" };

function clampPct(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, value));
}

/** Percent change between two period totals: "+12%", "−4%", "New", or "—". */
export function periodTrend(current: number, previous: number): { label: string; direction: "up" | "down" | "flat" } {
  if (previous === 0) return current > 0 ? { label: "New", direction: "up" } : { label: "—", direction: "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { label: "0%", direction: "flat" };
  return { label: `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`, direction: pct > 0 ? "up" : "down" };
}

export function buildSparkline(values: readonly number[]): { line: string; area: string } | null {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = 100 / (values.length - 1);
  const points = values.map((v, i) => ({ x: i * step, y: 28 - ((v - min) / range) * 24 - 2 }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L100 28 L0 28 Z` };
}

function Ring({ value, label, size = 60 }: { value: number; label?: string; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="kpi__visual relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value)}%${label ? ` ${label}` : ""}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle className="kpi__ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        {value > 0 ? (
          <circle
            className="kpi__ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (value / 100) * circumference}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-caption font-medium tabular-nums leading-none">{Math.round(value)}%</span>
        {label ? <span className="mt-0.5 max-w-[90%] truncate text-label text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

function Gauge({ value, label, size = 84 }: { value: number; label?: string; size?: number }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius;
  const cy = size / 2;
  const arc = `M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`;
  return (
    <div
      className="kpi__visual relative shrink-0"
      style={{ width: size, height: size / 2 + 10 }}
      role="img"
      aria-label={`${Math.round(value)}%${label ? ` ${label}` : ""}`}
    >
      <svg viewBox={`0 0 ${size} ${size / 2 + 8}`} className="size-full" aria-hidden>
        <path className="kpi__gauge-track" d={arc} fill="none" strokeWidth={stroke} strokeLinecap="round" />
        {value > 0 ? (
          <path
            className="kpi__gauge-fill"
            d={arc}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (value / 100) * circumference}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
        <span className="text-compact font-medium tabular-nums leading-none">{Math.round(value)}%</span>
        {label ? <span className="text-label text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  icon: IconComponent;
  description?: string;
  hint?: string;
  tone?: KpiTone;
  variant?: "filled" | "outlined";
  /** Period-over-period change chip (see `periodTrend`). */
  trend?: { label: string; direction: "up" | "down" | "flat" };
  status?: KpiStatus;
  /** 0–100 track under the value. */
  progress?: number;
  /** Line trend under the value. */
  sparkline?: readonly number[];
  /** Mini columns under the value. */
  bars?: readonly number[];
  /** 0–100 ring on the right. */
  ring?: number;
  /** 0–100 semi gauge on the right. */
  gauge?: number;
  visualLabel?: string;
  className?: string;
};

/** KPI tile (Kloqra DashboardStatCard): tone wash, value, trend, and one micro-visual. */
export function KpiCard({
  label,
  value,
  icon,
  description,
  hint,
  tone = "primary",
  variant = "filled",
  trend,
  status,
  progress,
  sparkline,
  bars,
  ring,
  gauge,
  visualLabel,
  className,
}: KpiCardProps) {
  const gradientId = useId().replace(/:/g, "");
  const ringValue = clampPct(ring);
  const gaugeValue = clampPct(gauge);
  const side = ringValue != null || gaugeValue != null;
  const progressValue = side ? null : clampPct(progress);
  const spark = sparkline ? buildSparkline(sparkline) : null;
  const barMax = bars?.length ? Math.max(...bars, 1) : 1;
  const TrendIcon =
    trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : ArrowRight;

  const underValue = spark ? (
    <svg className="kpi__sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={spark.area} fill={`url(#${gradientId})`} />
      <path
        d={spark.line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  ) : bars && bars.length >= 3 ? (
    <div className="kpi__bars" aria-hidden>
      {bars.map((v, i) => (
        <span key={i} style={{ height: `${Math.max(v > 0 ? 14 : 5, (v / barMax) * 100)}%` }} />
      ))}
    </div>
  ) : null;

  return (
    <div
      data-slot="kpi-card"
      className={cn("kpi", `kpi--${tone}`, variant === "outlined" && "kpi--outlined", className)}
    >
      <span className="kpi__glow" aria-hidden />
      <div className="kpi__body">
        <div className="kpi__header">
          <div className="flex min-w-0 items-center gap-1">
            <p className="kpi__label" title={label}>
              {label}
            </p>
            {description ? <WidgetInfoTooltip label={label} description={description} /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {status ? (
              <span className={cn("kpi__status", `kpi__status--${status.tone ?? "info"}`)}>{status.label}</span>
            ) : null}
            <span className="kpi__icon" aria-hidden>
              <Icon icon={icon} size="sm" lottie={false} />
            </span>
          </div>
        </div>
        <div className="kpi__split">
          <div className="kpi__main">
            <div className="kpi__value-row">
              <p className="kpi__value" title={typeof value === "string" ? value : undefined}>
                {value}
              </p>
              {trend ? (
                <span className={cn("kpi__trend", `kpi__trend--${trend.direction}`)}>
                  <TrendIcon className="size-3" aria-hidden />
                  {trend.label}
                </span>
              ) : null}
            </div>
            {!side ? underValue : null}
            {progressValue != null ? (
              <div
                className="kpi__progress"
                role="progressbar"
                aria-valuenow={Math.round(progressValue)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} ${Math.round(progressValue)}%`}
              >
                <span className="kpi__progress-fill" style={{ width: `${progressValue}%` }} />
              </div>
            ) : null}
            {hint ? (
              <p className="kpi__hint" title={hint}>
                {hint}
              </p>
            ) : null}
          </div>
          {ringValue != null ? <Ring value={ringValue} label={visualLabel} /> : null}
          {ringValue == null && gaugeValue != null ? <Gauge value={gaugeValue} label={visualLabel} /> : null}
        </div>
      </div>
    </div>
  );
}
