"use client";

import { Button } from "../components/button";
import { Badge } from "../components/badge";
import { MediaFrame } from "./media-frame";
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
  /** Profile attribute answers for dynamic compare rows (same-category). */
  attributes?: Array<{ key: string; label: string; display: string }>;
};

export function VendorCompareBoard({
  title = "Vendor vs vendor",
  columns,
  onClose,
  onView,
  onRemove,
  className,
  stickyFooter,
}: {
  title?: string;
  columns: VendorCompareColumn[];
  onClose?: () => void;
  onView?: (slug: string) => void;
  onRemove?: (slug: string) => void;
  className?: string;
  stickyFooter?: boolean;
}) {
  if (columns.length < 2) {
    return (
      <div className={cn("rounded-3xl border border-border/70 bg-card/40 p-8 text-center", className)}>
        <p className="font-serif text-2xl tracking-tight">Pick 2–3 vendors to compare</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Same category only — venues vs venues, photographers vs photographers.
        </p>
      </div>
    );
  }

  const rows: Array<{ label: string; values: string[] }> = [
    {
      label: "Starting price",
      values: columns.map((column) => column.priceLabel),
    },
    {
      label: "Typical spend",
      values: columns.map((column) => column.typicalSpendLabel || "—"),
    },
    {
      label: "Location",
      values: columns.map((column) => column.location),
    },
    {
      label: "Rating",
      values: columns.map((column) =>
        column.rating != null
          ? `★ ${column.rating.toFixed(1)}${column.ratingCount ? ` (${column.ratingCount})` : ""}`
          : "—",
      ),
    },
    {
      label: "Experience",
      values: columns.map((column) => {
        const years = column.yearsExperience != null ? `${column.yearsExperience} yrs` : null;
        const couples = column.couplesServed != null ? `${column.couplesServed} couples` : null;
        return [years, couples].filter(Boolean).join(" · ") || "—";
      }),
    },
    {
      label: "Headline",
      values: columns.map((column) => column.offerHeadline || "—"),
    },
    {
      label: "Packages",
      values: columns.map((column) => (column.packageNames?.length ? column.packageNames.join(" · ") : "Ask")),
    },
    {
      label: "Highlights",
      values: columns.map((column) =>
        column.inclusionHighlights?.length ? column.inclusionHighlights.slice(0, 4).join(" · ") : "—",
      ),
    },
    {
      label: "Service areas",
      values: columns.map((column) =>
        column.serviceAreas?.length ? column.serviceAreas.slice(0, 5).join(", ") : "—",
      ),
    },
    {
      label: "Travel",
      values: columns.map((column) => column.travelNote || "—"),
    },
    {
      label: "Overtime",
      values: columns.map((column) => column.overtimeNote || "—"),
    },
  ];

  const attributeKeys = new Map<string, string>();
  for (const column of columns) {
    for (const attr of column.attributes ?? []) {
      if (!attributeKeys.has(attr.key)) attributeKeys.set(attr.key, attr.label);
    }
  }
  for (const [key, label] of attributeKeys) {
    rows.push({
      label,
      values: columns.map((column) => {
        const match = column.attributes?.find((attr) => attr.key === key);
        return match?.display || "—";
      }),
    });
  }

  const shell = stickyFooter
    ? "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur"
    : "rounded-3xl border border-border/70 bg-card/30";

  return (
    <div className={cn(shell, className)}>
      <div className={cn("mx-auto grid max-w-6xl gap-5", stickyFooter ? "px-4 py-4 md:px-6" : "p-5 md:p-8")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/90">Compare</p>
            <h2 className="font-serif text-2xl tracking-tight md:text-3xl">{title}</h2>
          </div>
          {onClose ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>

        <div
          className="grid gap-4 overflow-x-auto"
          style={{ gridTemplateColumns: `minmax(7rem,9rem) repeat(${columns.length}, minmax(12rem,1fr))` }}
        >
          <div className="hidden md:block" />
          {columns.map((column) => (
            <div key={column.id} className="min-w-48 grid gap-2.5">
              <MediaFrame src={column.photoUrl} alt={column.name} aspect="aspect-[5/4]" />
              <p className="font-serif text-xl leading-tight tracking-tight">{column.name}</p>
              <p className="text-xs text-muted-foreground">{column.category}</p>
              <div className="flex flex-wrap gap-1">
                {column.verified ? <Badge intent="success">Verified</Badge> : null}
                {column.featured ? <Badge intent="love">Featured</Badge> : null}
                {column.destination ? <Badge intent="info">Destination</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {onView ? (
                  <Button type="button" size="sm" onClick={() => onView(column.slug)}>
                    View
                  </Button>
                ) : null}
                {onRemove ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onRemove(column.slug)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {rows.map((row) => (
            <div key={row.label} className="contents">
              <p className="border-t border-border/70 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {row.label}
              </p>
              {row.values.map((value, index) => (
                <p
                  key={`${row.label}-${columns[index]?.id}`}
                  className="min-w-48 border-t border-border/70 pt-3 text-sm leading-relaxed"
                >
                  {value}
                </p>
              ))}
            </div>
          ))}
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
  return (
    <VendorCompareBoard
      stickyFooter
      title={title}
      columns={columns}
      onClose={onClose}
      onView={onView}
    />
  );
}
