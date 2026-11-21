"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * Lightweight SVG charts for dashboard widgets. Colours are token classes
 * (`chart-tone-*` set `currentColor`), so palettes and dark mode just work and
 * outline-emphasis widgets restyle them in CSS.
 */
export type ChartTone =
  "1" | "2" | "3" | "4" | "5" | "success" | "warning" | "danger" | "info" | "love" | "premium" | "muted";

export const toneClass = (tone: ChartTone) => `chart-tone-${tone}`;

/** Cycle the five chart series tokens. */
export const seriesTone = (index: number): ChartTone => String((index % 5) + 1) as ChartTone;

const fmt = (n: number) => n.toLocaleString("en-LK");

export function ChartLegend({
  items,
  className,
}: {
  items: { key: string; label: ReactNode; tone: ChartTone; value?: ReactNode }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption", className)}>
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0 items-center gap-1.5">
          <span className={cn("chart__swatch", toneClass(item.tone))} aria-hidden />
          <span className="truncate text-muted-foreground">{item.label}</span>
          {item.value != null ? <span className="font-medium tabular-nums text-foreground">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

// ── Trend (area / line, multi-series, hover read-out) ────────────────────────

export type TrendSeries = { key: string; label: string; tone: ChartTone; values: number[] };

export function TrendChart({
  series,
  labels,
  formatLabel = (label) => label,
  ariaLabel,
  showLegend = true,
}: {
  series: TrendSeries[];
  /** One label per point (e.g. ISO dates). */
  labels: string[];
  formatLabel?: (label: string) => string;
  ariaLabel: string;
  showLegend?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const count = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const geometry = useMemo(
    () =>
      series.map((s) => {
        const pts = s.values.map((v, i) => [count > 1 ? (i / (count - 1)) * 100 : 50, 96 - (v / max) * 88] as const);
        const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
        return { ...s, pts, line, area: `${line} L100 100 L0 100 Z` };
      }),
    [series, count, max],
  );
  const totals = series.map((s) => s.values.reduce((a, b) => a + b, 0));
  const ticks = count > 2 ? [0, Math.floor((count - 1) / 2), count - 1] : labels.map((_, i) => i);
  const hoverX = hover != null && count > 1 ? (hover / (count - 1)) * 100 : null;

  return (
    <div className="chart">
      {showLegend ? (
        <ChartLegend
          items={series.map((s, i) => ({ key: s.key, label: s.label, tone: s.tone, value: fmt(totals[i] ?? 0) }))}
        />
      ) : null}
      <div
        className="chart__plot"
        role="img"
        aria-label={`${ariaLabel}: ${series.map((s, i) => `${s.label} ${fmt(totals[i] ?? 0)}`).join(", ")}`}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          setHover(Math.round(ratio * (count - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <svg className="chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {[8, 52, 96].map((y) => (
            <line key={y} className="chart__grid" x1="0" x2="100" y1={y} y2={y} vectorEffect="non-scaling-stroke" />
          ))}
          {geometry.map((s) => (
            <g key={s.key} className={toneClass(s.tone)}>
              <path className="chart__fill" d={s.area} />
              <path className="chart__line" d={s.line} />
            </g>
          ))}
          {hoverX != null ? <line className="chart__cursor" x1={hoverX} x2={hoverX} y1="0" y2="100" /> : null}
        </svg>
        {hover != null
          ? geometry.map((s) => {
              const pt = s.pts[hover];
              if (!pt) return null;
              return (
                <span
                  key={s.key}
                  className={cn(
                    "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card",
                    toneClass(s.tone),
                  )}
                  style={{ left: `${pt[0]}%`, top: `${pt[1]}%` }}
                  aria-hidden
                />
              );
            })
          : null}
        {hover != null && hoverX != null ? (
          <div className="chart__tooltip" style={{ left: `${Math.min(85, Math.max(15, hoverX))}%` }}>
            <p className="mb-1 text-label text-muted-foreground">{formatLabel(labels[hover] ?? "")}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className={cn("chart__swatch", toneClass(s.tone))} aria-hidden />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="ml-auto font-medium tabular-nums">{fmt(s.values[hover] ?? 0)}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="chart__axis" aria-hidden>
        {ticks.map((i) => (
          <span key={i}>{formatLabel(labels[i] ?? "")}</span>
        ))}
      </div>
    </div>
  );
}

// ── Columns ─────────────────────────────────────────────────────────────────

export function ColumnChart({
  data,
  tone = "1",
  ariaLabel,
  formatLabel = (label) => label,
}: {
  data: { label: string; value: number }[];
  tone?: ChartTone;
  ariaLabel: string;
  formatLabel?: (label: string) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const width = 100 / Math.max(1, data.length);
  const ticks = data.length > 2 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : data.map((_, i) => i);
  return (
    <div className="chart">
      <div
        className={cn("chart__plot", toneClass(tone))}
        role="img"
        aria-label={`${ariaLabel}: ${fmt(data.reduce((sum, d) => sum + d.value, 0))} in total`}
        onPointerLeave={() => setHover(null)}
      >
        <svg className="chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {[8, 52, 96].map((y) => (
            <line key={y} className="chart__grid" x1="0" x2="100" y1={y} y2={y} vectorEffect="non-scaling-stroke" />
          ))}
          {data.map((d, i) => {
            const h = (d.value / max) * 88;
            return (
              <rect
                key={d.label}
                className="chart__bar"
                x={i * width + width * 0.18}
                width={width * 0.64}
                y={96 - Math.max(h, d.value > 0 ? 1.5 : 0.6)}
                height={Math.max(h, d.value > 0 ? 1.5 : 0.6)}
                rx="0.8"
                fillOpacity={hover == null || hover === i ? 1 : 0.45}
                onPointerEnter={() => setHover(i)}
              />
            );
          })}
        </svg>
        {hover != null && data[hover] ? (
          <div
            className="chart__tooltip text-foreground"
            style={{ left: `${Math.min(85, Math.max(15, (hover + 0.5) * width))}%` }}
          >
            <p className="text-label text-muted-foreground">{formatLabel(data[hover].label)}</p>
            <p className="font-medium tabular-nums">{fmt(data[hover].value)}</p>
          </div>
        ) : null}
      </div>
      <div className="chart__axis" aria-hidden>
        {ticks.map((i) => (
          <span key={i}>{formatLabel(data[i]?.label ?? "")}</span>
        ))}
      </div>
    </div>
  );
}

// ── Donut ───────────────────────────────────────────────────────────────────

export type DonutSlice = { key: string; label: string; value: number; tone: ChartTone };

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  maxLegend = 6,
}: {
  slices: DonutSlice[];
  centerValue?: ReactNode;
  centerLabel?: string;
  ariaLabel: string;
  maxLegend?: number;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const length = total ? (s.value / total) * circumference : 0;
      const arc = { ...s, length, offset };
      offset += length;
      return arc;
    });
  const shown = slices.length > maxLegend ? slices.slice(0, maxLegend - 1) : slices;
  const hidden = slices.length - shown.length;
  const focus = active ? slices.find((s) => s.key === active) : null;

  return (
    <div className="flex h-full min-h-0 flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <div
        className="relative aspect-square h-full max-h-48 min-h-24"
        role="img"
        aria-label={`${ariaLabel}: ${slices.map((s) => `${s.label} ${fmt(s.value)}`).join(", ")}`}
      >
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle className="chart__slice-track" cx="50" cy="50" r={r} strokeWidth="12" />
          {arcs.map((a) => (
            <circle
              key={a.key}
              className={cn("chart__slice", toneClass(a.tone))}
              cx="50"
              cy="50"
              r={r}
              strokeWidth={active === a.key ? 15 : 12}
              strokeDasharray={`${Math.max(0, a.length - (arcs.length > 1 ? 1.2 : 0))} ${circumference}`}
              strokeDashoffset={-a.offset}
              onPointerEnter={() => setActive(a.key)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-serif text-h3 leading-none tabular-nums">
            {focus ? fmt(focus.value) : (centerValue ?? fmt(total))}
          </span>
          <span className="mt-1 max-w-[70%] truncate text-label text-muted-foreground">
            {focus ? focus.label : centerLabel}
          </span>
        </div>
      </div>
      <ul className="grid min-w-0 gap-1.5 text-caption">
        {shown.map((s) => (
          <li
            key={s.key}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-md transition-opacity",
              active && active !== s.key && "opacity-50",
            )}
            onPointerEnter={() => setActive(s.key)}
            onPointerLeave={() => setActive(null)}
          >
            <span className={cn("chart__swatch", toneClass(s.tone))} aria-hidden />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{fmt(s.value)}</span>
            <span className="w-9 text-right tabular-nums text-muted-foreground">
              {total ? `${Math.round((s.value / total) * 100)}%` : "—"}
            </span>
          </li>
        ))}
        {hidden > 0 ? <li className="text-muted-foreground">+{hidden} more</li> : null}
      </ul>
    </div>
  );
}

// ── Ranked horizontal bars / meters ─────────────────────────────────────────

export function RankedBars({
  rows,
  tone = "1",
  formatValue = fmt,
  max: maxOverride,
}: {
  rows: { key: string; label: ReactNode; value: number; tone?: ChartTone; hint?: ReactNode; href?: string }[];
  tone?: ChartTone;
  formatValue?: (value: number) => ReactNode;
  /** Scale the bars against this (e.g. a budget cap) instead of the largest row. */
  max?: number;
}) {
  const max = Math.max(1, maxOverride ?? Math.max(0, ...rows.map((r) => r.value)));
  return (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid gap-1.5">
          <div className="flex min-w-0 items-baseline justify-between gap-3 text-compact">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatValue(row.value)}
              {row.hint ? (
                <span className="ml-1.5 text-caption font-normal text-muted-foreground">{row.hint}</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full rounded-full bg-current transition-[width] duration-700",
                toneClass(row.tone ?? tone),
              )}
              style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Progress ring ───────────────────────────────────────────────────────────

/** Large 0–100 ring with a serif centre value (readiness, planning progress, RSVPs). */
export function ProgressRing({
  value,
  label,
  centerValue,
  tone = "1",
  size = 132,
}: {
  value: number;
  label?: string;
  centerValue?: ReactNode;
  tone?: ChartTone;
  size?: number;
}) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div
      className={cn("relative shrink-0", toneClass(tone))}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct)}%${label ? ` ${label}` : ""}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <circle className="chart__slice-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        {pct > 0 ? (
          <circle
            className="chart__slice transition-[stroke-dashoffset] duration-700"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-foreground">
        <span className="font-serif text-h2 leading-none tabular-nums">{centerValue ?? `${Math.round(pct)}%`}</span>
        {label ? <span className="mt-1 max-w-[75%] truncate text-label text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}
