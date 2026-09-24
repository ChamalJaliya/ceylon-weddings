"use client";

import type { CSSProperties, ReactNode } from "react";
import { Badge } from "../components/badge";
import { Input } from "../components/input";
import { SimpleSelect } from "../components/select";
import { Textarea } from "../components/textarea";
import { cn } from "../lib/utils";
import { FieldBlock, FormGrid, TagInput } from "./creator-form";
import { StudioPanel } from "./offer-studio";
import { Reveal } from "./motion";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";

export type AdsPromotionLayout = "SPOTLIGHT" | "BANNER" | "CARD" | "STRIP" | "PICKS_TILE";
export type AdsPromotionSlot =
  | "HOME_HERO"
  | "HOME_PICKS"
  | "CATALOG_TOP"
  | "CATALOG_INLINE"
  | "IDEAS_RAIL"
  | "VENDOR_SIDEBAR";
export type AdsPromotionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type AdsPromotionSource = "EDITORIAL" | "COMPED" | "PAID_PENDING" | "PAID";

export type AdsPromotionDraft = {
  name: string;
  status: AdsPromotionStatus;
  headline: string;
  subheadline: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  coverUrl: string | null;
  secondaryUrl: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  overlayTone: string;
  layout: AdsPromotionLayout;
  badgeLabel: string | null;
  slots: AdsPromotionSlot[];
  cities: string[];
  categories: string[];
  locales: string[];
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  vendorId: string | null;
  vendorName?: string | null;
  source: AdsPromotionSource;
  notes: string | null;
};

export const PROMOTION_LAYOUTS: AdsPromotionLayout[] = ["SPOTLIGHT", "BANNER", "CARD", "STRIP", "PICKS_TILE"];
export const PROMOTION_SLOTS: AdsPromotionSlot[] = [
  "HOME_HERO",
  "HOME_PICKS",
  "CATALOG_TOP",
  "CATALOG_INLINE",
  "IDEAS_RAIL",
  "VENDOR_SIDEBAR",
];
export const PROMOTION_STATUSES: AdsPromotionStatus[] = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ARCHIVED"];

export function SlotPicker({
  values,
  onChange,
}: {
  values: AdsPromotionSlot[];
  onChange: (next: AdsPromotionSlot[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMOTION_SLOTS.map((slot) => {
        const active = values.includes(slot);
        return (
          <button
            key={slot}
            type="button"
            onClick={() =>
              onChange(active ? values.filter((item) => item !== slot) : [...values, slot])
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-foreground/30 bg-foreground text-background"
                : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {slot.replaceAll("_", " ")}
          </button>
        );
      })}
    </div>
  );
}

export function PromotionCreativeFields({
  value,
  onChange,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
}) {
  return (
    <StudioPanel title="Creative" description="Copy, media, layout, and accent — what couples see.">
      <FormGrid cols={2}>
        <FieldBlock label="Internal name" compact>
          <Input className={fieldClass} value={value.name} onChange={(e) => onChange({ name: e.target.value })} />
        </FieldBlock>
        <FieldBlock label="Layout" compact>
          <SimpleSelect
            value={value.layout}
            onValueChange={(layout) => onChange({ layout: layout as AdsPromotionLayout })}
            options={PROMOTION_LAYOUTS.map((layout) => ({ value: layout, label: layout }))}
          />
        </FieldBlock>
        <FieldBlock label="Headline" compact className="md:col-span-2">
          <Input
            className={fieldClass}
            value={value.headline}
            onChange={(e) => onChange({ headline: e.target.value })}
          />
        </FieldBlock>
        <FieldBlock label="Subheadline" compact className="md:col-span-2">
          <Input
            className={fieldClass}
            value={value.subheadline ?? ""}
            onChange={(e) => onChange({ subheadline: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Body" compact className="md:col-span-2">
          <Textarea
            className="min-h-24 rounded-xl border-border/80 bg-background/70"
            value={value.body ?? ""}
            onChange={(e) => onChange({ body: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="CTA label" compact>
          <Input
            className={fieldClass}
            value={value.ctaLabel ?? ""}
            onChange={(e) => onChange({ ctaLabel: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="CTA link" compact hint="Path or URL">
          <Input
            className={fieldClass}
            value={value.ctaHref ?? ""}
            onChange={(e) => onChange({ ctaHref: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Cover image URL" compact className="md:col-span-2">
          <Input
            className={fieldClass}
            value={value.coverUrl ?? ""}
            onChange={(e) => onChange({ coverUrl: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Secondary image" compact>
          <Input
            className={fieldClass}
            value={value.secondaryUrl ?? ""}
            onChange={(e) => onChange({ secondaryUrl: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Logo URL" compact>
          <Input
            className={fieldClass}
            value={value.logoUrl ?? ""}
            onChange={(e) => onChange({ logoUrl: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Badge" compact>
          <Input
            className={fieldClass}
            value={value.badgeLabel ?? ""}
            onChange={(e) => onChange({ badgeLabel: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Accent color" compact hint="#hex">
          <Input
            className={fieldClass}
            value={value.accentColor ?? ""}
            onChange={(e) => onChange({ accentColor: e.target.value || null })}
          />
        </FieldBlock>
        <FieldBlock label="Overlay tone" compact>
          <SimpleSelect
            value={value.overlayTone === "light" ? "light" : "dark"}
            onValueChange={(tone) => onChange({ overlayTone: tone })}
            options={[
              { value: "dark", label: "Dark text on light" },
              { value: "light", label: "Light text on dark" },
            ]}
          />
        </FieldBlock>
      </FormGrid>
    </StudioPanel>
  );
}

export function PromotionTargetingFields({
  value,
  onChange,
  categoryOptions,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
  categoryOptions: Array<{ value: string; label: string }>;
}) {
  return (
    <StudioPanel title="Targeting" description="Where it shows and who sees it. Empty = all.">
      <FieldBlock label="Slots" compact>
        <SlotPicker values={value.slots} onChange={(slots) => onChange({ slots })} />
      </FieldBlock>
      <FormGrid cols={2}>
        <FieldBlock label="Cities" compact>
          <TagInput values={value.cities} onChange={(cities) => onChange({ cities })} placeholder="Colombo, Kandy…" />
        </FieldBlock>
        <FieldBlock label="Locales" compact>
          <TagInput values={value.locales} onChange={(locales) => onChange({ locales })} placeholder="en, si, ta" />
        </FieldBlock>
        <FieldBlock label="Categories" compact className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => {
              const active = value.categories.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    active ? "border-foreground/30 bg-foreground text-background" : "border-border/70",
                  )}
                  onClick={() =>
                    onChange({
                      categories: active
                        ? value.categories.filter((item) => item !== option.value)
                        : [...value.categories, option.value],
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </FieldBlock>
        <FieldBlock label="Priority" compact hint="Higher ranks first">
          <Input
            type="number"
            className={fieldClass}
            value={value.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) || 0 })}
          />
        </FieldBlock>
      </FormGrid>
    </StudioPanel>
  );
}

export function PromotionScheduleFields({
  value,
  onChange,
  showSource = true,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
  showSource?: boolean;
}) {
  return (
    <StudioPanel title="Schedule & publish" description="Window, status, and ops notes.">
      <FormGrid cols={2}>
        <FieldBlock label="Status" compact>
          <SimpleSelect
            value={value.status}
            onValueChange={(status) => onChange({ status: status as AdsPromotionStatus })}
            options={PROMOTION_STATUSES.map((status) => ({ value: status, label: status }))}
          />
        </FieldBlock>
        {showSource ? (
          <FieldBlock label="Source" compact>
            <SimpleSelect
              value={value.source}
              onValueChange={(source) => onChange({ source: source as AdsPromotionSource })}
              options={[
                { value: "EDITORIAL", label: "Editorial" },
                { value: "COMPED", label: "Comped" },
                { value: "PAID_PENDING", label: "Paid pending" },
                { value: "PAID", label: "Paid" },
              ]}
            />
          </FieldBlock>
        ) : null}
        <FieldBlock label="Starts" compact>
          <Input
            type="datetime-local"
            className={fieldClass}
            value={toLocalInput(value.startsAt)}
            onChange={(e) =>
              onChange({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        </FieldBlock>
        <FieldBlock label="Ends" compact>
          <Input
            type="datetime-local"
            className={fieldClass}
            value={toLocalInput(value.endsAt)}
            onChange={(e) =>
              onChange({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        </FieldBlock>
        <FieldBlock label="Notes" compact className="md:col-span-2">
          <Textarea
            className="min-h-20 rounded-xl border-border/80 bg-background/70"
            value={value.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value || null })}
          />
        </FieldBlock>
      </FormGrid>
    </StudioPanel>
  );
}

export function PromotionPreview({
  promo,
  slotHint,
}: {
  promo: AdsPromotionDraft;
  slotHint?: string;
}) {
  const light = promo.overlayTone === "light";
  const accent = promo.accentColor || "#1c1917";

  return (
    <Reveal className="sticky top-24 grid gap-3" y={8}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Live preview</p>
        <Badge>{promo.status}</Badge>
      </div>
      {slotHint ? <p className="text-xs text-muted-foreground">{slotHint}</p> : null}
      <PromotionCreative
        promo={promo}
        className={cn(
          promo.layout === "BANNER" || promo.layout === "SPOTLIGHT" ? "min-h-56" : "min-h-44",
          "rounded-2xl",
        )}
        style={{ ["--promo-accent" as string]: accent }}
        light={light}
      />
    </Reveal>
  );
}

export function PromotionCreative({
  promo,
  className,
  style,
  light,
  action,
}: {
  promo: Pick<
    AdsPromotionDraft,
    | "layout"
    | "headline"
    | "subheadline"
    | "body"
    | "ctaLabel"
    | "coverUrl"
    | "logoUrl"
    | "badgeLabel"
    | "vendorName"
  >;
  className?: string;
  style?: CSSProperties;
  light?: boolean;
  action?: ReactNode;
}) {
  const isStrip = promo.layout === "STRIP";
  const isBanner = promo.layout === "BANNER" || promo.layout === "SPOTLIGHT";

  return (
    <article
      data-slot="promotion-creative"
      className={cn(
        "relative overflow-hidden border border-border/60 bg-card shadow-sm",
        isStrip ? "grid gap-0 sm:grid-cols-[9rem_1fr]" : "grid",
        className,
      )}
      style={style}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-secondary/40",
          isStrip ? "min-h-28 sm:min-h-full" : isBanner ? "min-h-48" : "min-h-36",
        )}
      >
        {promo.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
        )}
        <div
          className={cn(
            "absolute inset-0",
            light
              ? "bg-gradient-to-t from-black/55 via-black/15 to-transparent"
              : "bg-gradient-to-t from-white/80 via-white/20 to-transparent",
          )}
        />
      </div>
      <div className={cn("relative grid gap-2 p-4", light ? "text-white" : "text-foreground")}>
        <div className="flex flex-wrap items-center gap-2">
          {promo.badgeLabel ? <Badge intent="love">{promo.badgeLabel}</Badge> : null}
          {promo.vendorName ? <span className="text-xs opacity-80">{promo.vendorName}</span> : null}
          {promo.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={promo.logoUrl} alt="" className="ml-auto h-7 w-auto rounded-md bg-white/80 p-1" />
          ) : null}
        </div>
        <h3 className={cn("font-serif tracking-tight", isBanner ? "text-2xl" : "text-xl")}>{promo.headline || "Headline"}</h3>
        {promo.subheadline ? <p className="text-sm opacity-90">{promo.subheadline}</p> : null}
        {promo.body && promo.layout !== "STRIP" ? (
          <p className="line-clamp-3 text-sm opacity-80">{promo.body}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {promo.ctaLabel ? (
            <span
              className="inline-flex rounded-full px-3 py-1.5 text-xs font-medium text-white"
              style={{ background: "var(--promo-accent, #1c1917)" }}
            >
              {promo.ctaLabel}
            </span>
          ) : null}
          {action}
        </div>
      </div>
    </article>
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function emptyPromotionDraft(partial?: Partial<AdsPromotionDraft>): AdsPromotionDraft {
  return {
    name: "",
    status: "DRAFT",
    headline: "",
    subheadline: null,
    body: null,
    ctaLabel: "Browse vendors",
    ctaHref: "/vendors",
    coverUrl: null,
    secondaryUrl: null,
    logoUrl: null,
    accentColor: "#7c2d12",
    overlayTone: "light",
    layout: "CARD",
    badgeLabel: "Featured",
    slots: ["HOME_PICKS"],
    cities: [],
    categories: [],
    locales: [],
    startsAt: null,
    endsAt: null,
    priority: 10,
    vendorId: null,
    source: "EDITORIAL",
    notes: null,
    ...partial,
  };
}
