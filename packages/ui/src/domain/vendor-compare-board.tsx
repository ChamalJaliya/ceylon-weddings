"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, Check, Plane, Plus, Sparkles, Star, Trophy, X } from "lucide-react";
import { Button } from "../components/button";
import { Switch } from "../components/switch";
import { cn } from "../lib/utils";

export type VendorCompareColumn = {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  priceLabel: string;
  typicalSpendLabel?: string | null;
  photoUrl?: string | null;
  verified?: boolean;
  featured?: boolean;
  destination?: boolean;
  rating?: number;
  ratingCount?: number;
  yearsExperience?: number | null;
  couplesServed?: number | null;
  offerHeadline?: string | null;
  packageNames?: string[];
  inclusionHighlights?: string[];
  serviceAreas?: string[];
  travelNote?: string | null;
  overtimeNote?: string | null;
  /** Numeric starting price (LKR) — used to flag the lowest price. */
  priceValue?: number | null;
  /** Profile attribute answers for dynamic compare rows (same-category). */
  attributes?: Array<{ key: string; label: string; display: string }>;
};

type Cell = { node: ReactNode; text: string; win?: boolean };
type Row = { label: string; cells: Cell[] };
type Group = { title: string; rows: Row[] };

const DASH = <span className="text-muted-foreground/60">—</span>;

function Chips({ items: raw }: { items: string[] }) {
  const items = [...new Set(raw)];
  if (!items.length) return DASH;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
          {item}
        </span>
      ))}
    </div>
  );
}

function Checks({ items: raw }: { items: string[] }) {
  const items = [...new Set(raw)];
  if (!items.length) return DASH;
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function text(value?: string | null): Cell {
  return value ? { node: value, text: value } : { node: DASH, text: "" };
}

function bestIndex(values: Array<number | null | undefined>, mode: "min" | "max") {
  const valid = values.map((v, i) => [v, i] as const).filter(([v]) => v != null && v > 0) as Array<[number, number]>;
  if (valid.length < 2) return -1;
  const sorted = [...valid].sort((a, b) => (mode === "min" ? a[0] - b[0] : b[0] - a[0]));
  return sorted[0]![0] === sorted[1]![0] ? -1 : sorted[0]![1];
}

export function VendorCompareBoard({
  title = "Vendor vs vendor",
  columns,
  onClose,
  onView,
  onRemove,
  addHref,
  className,
  stickyFooter,
}: {
  title?: string;
  columns: VendorCompareColumn[];
  onClose?: () => void;
  onView?: (slug: string) => void;
  onRemove?: (slug: string) => void;
  /** Shows an "add a vendor" slot when fewer than three are compared. */
  addHref?: string;
  className?: string;
  stickyFooter?: boolean;
}) {
  const [diffOnly, setDiffOnly] = useState(false);

  const winners = useMemo(
    () => ({
      price: bestIndex(
        columns.map((c) => c.priceValue),
        "min",
      ),
      rating: bestIndex(
        columns.map((c) => c.rating),
        "max",
      ),
      years: bestIndex(
        columns.map((c) => c.yearsExperience),
        "max",
      ),
      couples: bestIndex(
        columns.map((c) => c.couplesServed),
        "max",
      ),
    }),
    [columns],
  );

  const groups = useMemo<Group[]>(() => {
    const attributeKeys = new Map<string, string>();
    for (const column of columns) {
      for (const attr of column.attributes ?? []) {
        if (!attributeKeys.has(attr.key)) attributeKeys.set(attr.key, attr.label);
      }
    }
    const specRows: Row[] = [...attributeKeys].map(([key, label]) => ({
      label,
      cells: columns.map((column) => {
        const value = column.attributes?.find((attr) => attr.key === key)?.display ?? "";
        const parts = value.split(/\s+·\s+/).filter(Boolean);
        if (!value) return { node: DASH, text: "" };
        return { node: parts.length > 1 ? <Chips items={parts} /> : value, text: value };
      }),
    }));

    return [
      {
        title: "At a glance",
        rows: [
          {
            label: "Starting price",
            cells: columns.map((c, i) => ({
              node: <span className="font-serif text-xl">{c.priceLabel}</span>,
              text: c.priceLabel,
              win: i === winners.price,
            })),
          },
          { label: "Typical spend", cells: columns.map((c) => text(c.typicalSpendLabel)) },
          {
            label: "Rating",
            cells: columns.map((c, i) =>
              c.rating
                ? {
                    node: (
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="size-4 fill-primary text-primary" />
                        <span className="font-medium">{c.rating.toFixed(1)}</span>
                        {c.ratingCount ? (
                          <span className="text-muted-foreground">· {c.ratingCount} reviews</span>
                        ) : null}
                      </span>
                    ),
                    text: `${c.rating}-${c.ratingCount}`,
                    win: i === winners.rating,
                  }
                : { node: <span className="text-muted-foreground">New</span>, text: "" },
            ),
          },
          {
            label: "Experience",
            cells: columns.map((c, i) => {
              const parts = [
                c.yearsExperience != null ? `${c.yearsExperience} years` : null,
                c.couplesServed != null ? `${c.couplesServed} couples` : null,
              ].filter(Boolean) as string[];
              return parts.length
                ? { node: parts.join(" · "), text: parts.join(), win: i === winners.years || i === winners.couples }
                : { node: DASH, text: "" };
            }),
          },
        ],
      },
      {
        title: "What you get",
        rows: [
          { label: "Their pitch", cells: columns.map((c) => text(c.offerHeadline)) },
          {
            label: "Packages",
            cells: columns.map((c) => ({
              node: c.packageNames?.length ? (
                <Chips items={c.packageNames} />
              ) : (
                <span className="text-muted-foreground">Ask</span>
              ),
              text: (c.packageNames ?? []).join(),
            })),
          },
          {
            label: "Included",
            cells: columns.map((c) => ({
              node: <Checks items={c.inclusionHighlights ?? []} />,
              text: (c.inclusionHighlights ?? []).join(),
            })),
          },
        ],
      },
      {
        title: "Logistics",
        rows: [
          { label: "Based in", cells: columns.map((c) => text([...new Set(c.location.split(/,\s*/))].join(", "))) },
          {
            label: "Service areas",
            cells: columns.map((c) => ({
              node: <Chips items={(c.serviceAreas ?? []).slice(0, 6)} />,
              text: (c.serviceAreas ?? []).join(),
            })),
          },
          { label: "Travel", cells: columns.map((c) => text(c.travelNote)) },
          { label: "Overtime", cells: columns.map((c) => text(c.overtimeNote)) },
        ],
      },
      ...(specRows.length ? [{ title: "Specs", rows: specRows }] : []),
    ];
  }, [columns, winners]);

  if (columns.length < 2) {
    return (
      <div className={cn("rounded-3xl border border-dashed border-border p-8 text-center", className)}>
        <p className="font-serif text-2xl tracking-tight">Pick 2–3 vendors to compare</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Same category only — venues vs venues, photographers vs photographers.
        </p>
      </div>
    );
  }

  const showAdd = Boolean(addHref) && columns.length < 3 && !stickyFooter;
  const slots = columns.length + (showAdd ? 1 : 0);
  const gridStyle = {
    gridTemplateColumns: `minmax(8rem,10rem) repeat(${slots}, minmax(0,1fr))`,
    ["--cmp-min" as string]: `${9 + slots * 13}rem`,
  };
  const isDifferent = (row: Row) => new Set(row.cells.map((cell) => cell.text)).size > 1;
  const winLabel = (row: Row) =>
    row.label === "Starting price" ? "Lowest" : row.label === "Rating" ? "Top rated" : "Most experienced";

  const shell = stickyFooter
    ? "fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto border-t border-border bg-background/95 shadow-dock backdrop-blur"
    : "rounded-3xl border border-border bg-card shadow-card";

  return (
    <div className={cn(shell, className)}>
      <div className={cn("grid gap-5", stickyFooter ? "mx-auto max-w-6xl px-4 py-4 md:px-6" : "p-4 md:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <p className="text-label font-medium tracking-eyebrow text-primary uppercase">Side by side</p>
            <h2 className="font-serif text-2xl tracking-tight md:text-3xl">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={diffOnly} onCheckedChange={setDiffOnly} aria-label="Only show differences" />
              Only differences
            </label>
            {onClose ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            ) : null}
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <div className="grid w-full min-w-[var(--cmp-min)] gap-x-3 md:min-w-0" style={gridStyle}>
            {/* Vendor header */}
            <div className="col-span-full grid grid-cols-subgrid gap-x-3 pt-1 pb-2">
              <div />
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="group relative grid gap-3 rounded-2xl border border-border bg-background/60 p-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                    {column.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={column.photoUrl} alt={column.name} className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center font-serif text-5xl text-primary/40">
                        {column.name.slice(0, 1)}
                      </span>
                    )}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {column.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-2 py-0.5 text-label font-medium text-ink">
                          <Sparkles className="size-3" /> Featured
                        </span>
                      ) : null}
                      {column.destination ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-2 py-0.5 text-label font-medium text-ink">
                          <Plane className="size-3" /> Destination
                        </span>
                      ) : null}
                    </div>
                    {onRemove ? (
                      <button
                        type="button"
                        aria-label={`Remove ${column.name}`}
                        onClick={() => onRemove(column.slug)}
                        className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition hover:bg-paper"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-0.5 px-1">
                    <p className="flex items-center gap-1.5 font-serif text-xl leading-tight">
                      <span className="truncate">{column.name}</span>
                      {column.verified ? (
                        <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {column.category} · {[...new Set(column.location.split(/,\s*/))].join(", ")}
                    </p>
                  </div>
                  {onView ? (
                    <Button type="button" size="sm" className="mx-1 mb-1" onClick={() => onView(column.slug)}>
                      View profile
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {showAdd ? (
                <a
                  href={addHref}
                  className="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-secondary">
                    <Plus className="size-5" />
                  </span>
                  Add a third option
                </a>
              ) : null}
            </div>

            {/* Slim sticky name bar so columns stay labelled while scrolling */}
            <div
              className={cn(
                "col-span-full grid grid-cols-subgrid gap-x-3 border-b border-border bg-card/95 py-2 backdrop-blur",
                stickyFooter ? "sticky top-0 z-20" : "sticky top-20 z-20",
              )}
            >
              <div />
              {columns.map((column) => (
                <div key={column.id} className="flex min-w-0 items-center gap-2 px-1">
                  {column.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={column.photoUrl} alt="" className="size-7 shrink-0 rounded-full object-cover" />
                  ) : null}
                  <span className="truncate text-sm font-medium">{column.name}</span>
                </div>
              ))}
              {showAdd ? <div /> : null}
            </div>

            {groups.map((group) => {
              const rows = diffOnly ? group.rows.filter(isDifferent) : group.rows;
              if (!rows.length) return null;
              return (
                <div key={group.title} className="col-span-full grid grid-cols-subgrid gap-x-3">
                  <p className="col-span-full mt-4 mb-1 text-label font-medium tracking-eyebrow text-primary uppercase">
                    {group.title}
                  </p>
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="col-span-full grid grid-cols-subgrid gap-x-3 border-t border-border/70"
                    >
                      <p className="py-3.5 pr-2 text-sm text-muted-foreground">{row.label}</p>
                      {row.cells.map((cell, index) => (
                        <div
                          key={`${row.label}-${columns[index]?.id}`}
                          className={cn(
                            "relative my-1.5 min-w-0 rounded-xl px-3 py-2 text-sm leading-relaxed break-words",
                            cell.win && "bg-success/10 ring-1 ring-success/25",
                          )}
                        >
                          {cell.win ? (
                            <span className="mb-1 flex items-center gap-1 text-label font-medium tracking-wide text-success uppercase">
                              <Trophy className="size-3" />
                              {winLabel(row)}
                            </span>
                          ) : null}
                          {cell.node}
                        </div>
                      ))}
                      {showAdd ? <div /> : null}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact sticky tray used on Team — thin wrapper over the board. */
export function VendorCompareTray({
  open,
  title,
  columns,
  onClose,
  onView,
}: {
  open: boolean;
  title?: string;
  columns: VendorCompareColumn[];
  onClose: () => void;
  onView?: (slug: string) => void;
}) {
  if (!open || columns.length < 2) return null;
  return <VendorCompareBoard stickyFooter title={title} columns={columns} onClose={onClose} onView={onView} />;
}
