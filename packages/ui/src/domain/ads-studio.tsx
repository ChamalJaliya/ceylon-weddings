"use client";

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import {
  CalendarClock,
  Check,
  Circle,
  ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Link2,
  Megaphone,
  MousePointerClick,
  Palette,
  Send,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  Type,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "../components/badge";
import type { BadgeIntent } from "../contracts/badge";
import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Input } from "../components/input";
import { Textarea } from "../components/textarea";
import { cn } from "../lib/utils";
import { FieldBlock, FormGrid, FormGroup, TagInput, type CreatorSection } from "./creator-form";
import { Reveal } from "./motion";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";

/** Default accent saved onto a new promotion (user data). design-system: user-data-colors */
const DEFAULT_PROMO_ACCENT = "#7c2d12";

/** Accent presets offered in the studio — saved onto the promotion as user data. */
const ACCENT_PRESETS: Array<{ value: string; label: string }> = [
  { value: "#7c2d12", label: "Maroon" }, // design-system: user-data-colors
  { value: "#b45309", label: "Temple gold" }, // design-system: user-data-colors
  { value: "#0f766e", label: "Jade" }, // design-system: user-data-colors
  { value: "#be185d", label: "Lotus" }, // design-system: user-data-colors
  { value: "#312e81", label: "Night" }, // design-system: user-data-colors
  { value: "#1c1917", label: "Ink" }, // design-system: user-data-colors
];

export type AdsPromotionLayout = "SPOTLIGHT" | "BANNER" | "CARD" | "STRIP" | "PICKS_TILE";
export type AdsPromotionSlot =
  "HOME_HERO" | "HOME_PICKS" | "CATALOG_TOP" | "CATALOG_INLINE" | "IDEAS_RAIL" | "VENDOR_SIDEBAR";
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

/** Uploads one image and resolves to its public URL. */
export type PromotionUploadFn = (file: File) => Promise<string>;

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

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

export const LAYOUT_META: Record<AdsPromotionLayout, { label: string; description: string }> = {
  SPOTLIGHT: { label: "Spotlight", description: "Tall, full-bleed photo with copy on top" },
  BANNER: { label: "Banner", description: "Wide photo, copy on the left" },
  CARD: { label: "Card", description: "Photo above, copy below" },
  STRIP: { label: "Strip", description: "Slim row — thumbnail and one line" },
  PICKS_TILE: { label: "Picks tile", description: "Portrait tile, like an editor's pick" },
};

export const SLOT_META: Record<
  AdsPromotionSlot,
  { label: string; page: string; where: string; live: boolean; suggested: AdsPromotionLayout }
> = {
  HOME_HERO: {
    label: "Home hero",
    page: "Homepage",
    where: "Full-width, right under the hero",
    live: true,
    suggested: "SPOTLIGHT",
  },
  HOME_PICKS: {
    label: "Home picks",
    page: "Homepage",
    where: "Alongside the editor's picks",
    live: true,
    suggested: "CARD",
  },
  CATALOG_TOP: {
    label: "Search top",
    page: "Vendor search",
    where: "Above results — matches the category filter",
    live: true,
    suggested: "BANNER",
  },
  CATALOG_INLINE: {
    label: "Search inline",
    page: "Vendor search",
    where: "Between search results",
    live: false,
    suggested: "STRIP",
  },
  IDEAS_RAIL: {
    label: "Ideas rail",
    page: "Ideas & inspiration",
    where: "In the inspiration rail",
    live: false,
    suggested: "PICKS_TILE",
  },
  VENDOR_SIDEBAR: {
    label: "Vendor sidebar",
    page: "Vendor profiles",
    where: "Beside a vendor's profile",
    live: false,
    suggested: "CARD",
  },
};

export const STATUS_META: Record<AdsPromotionStatus, { label: string; intent: BadgeIntent; description: string }> = {
  DRAFT: { label: "Draft", intent: "default", description: "Only visible here" },
  SCHEDULED: { label: "Scheduled", intent: "info", description: "Goes live on the start date" },
  ACTIVE: { label: "Live", intent: "success", description: "Showing now, within its dates" },
  PAUSED: { label: "Paused", intent: "warning", description: "Hidden until resumed" },
  ARCHIVED: { label: "Archived", intent: "outline", description: "Retired — kept for reporting" },
};

const SOURCE_META: Record<AdsPromotionSource, { label: string; description: string }> = {
  EDITORIAL: { label: "Editorial", description: "Our own pick" },
  COMPED: { label: "Comped", description: "Free for the vendor" },
  PAID_PENDING: { label: "Paid · pending", description: "Awaiting payment" },
  PAID: { label: "Paid", description: "Payment received" },
};

const LOCALE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" },
];

const CITY_SUGGESTIONS = ["Colombo", "Kandy", "Galle", "Negombo", "Bentota", "Nuwara Eliya"];

const CHECK_META: Record<string, { label: string; section: PromotionSectionId }> = {
  name: { label: "Campaign name", section: "creative" },
  headline: { label: "Headline", section: "creative" },
  cover: { label: "Cover image", section: "creative" },
  cta: { label: "Button label & link", section: "creative" },
  layout: { label: "Layout", section: "creative" },
  slots: { label: "At least one placement", section: "targeting" },
  schedule: { label: "Start & end dates", section: "schedule" },
};

export type PromotionSectionId = "creative" | "targeting" | "schedule" | "publish";

type Completeness = { score: number; total: number; missing: string[]; ready: boolean };

/** The four studio steps, with done-state derived from the draft. */
export function promotionSections(draft: AdsPromotionDraft, completeness: Completeness): CreatorSection[] {
  const missing = new Set(completeness.missing);
  return [
    {
      id: "creative",
      label: "Creative",
      hint: "Copy, imagery & look",
      icon: Sparkles,
      done: !["name", "headline", "cover", "cta", "layout"].some((key) => missing.has(key)),
    },
    { id: "targeting", label: "Placement", hint: "Where & who", icon: Target, done: draft.slots.length > 0 },
    {
      id: "schedule",
      label: "Schedule",
      hint: "When it runs",
      icon: CalendarClock,
      done: Boolean(draft.startsAt && draft.endsAt),
    },
    { id: "publish", label: "Review", hint: "Check & launch", icon: Send, done: completeness.ready },
  ];
}

export function nextPromotionSection(current: PromotionSectionId, step: 1 | -1): PromotionSectionId | null {
  const order: PromotionSectionId[] = ["creative", "targeting", "schedule", "publish"];
  return order[order.indexOf(current) + step] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */

export function PromotionStatusBadge({ status, className }: { status: AdsPromotionStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge intent={meta.intent} className={className}>
      {meta.label}
    </Badge>
  );
}

function CharCount({ value, max }: { value: string | null | undefined; max: number }) {
  const length = value?.length ?? 0;
  if (!length) return null;
  return (
    <span className={cn("text-label tabular-nums", length > max ? "text-warning-fg" : "text-muted-foreground")}>
      {length}/{max}
    </span>
  );
}

function CountedField({
  label,
  hint,
  value,
  max,
  className,
  children,
}: {
  label: string;
  hint?: string;
  value: string | null | undefined;
  max: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      <FieldBlock label={label} hint={hint} compact>
        {children}
      </FieldBlock>
      <span className="absolute top-0 right-0">
        <CharCount value={value} max={max} />
      </span>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5 rounded-xl bg-secondary/50 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.description}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition",
              active ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
        active
          ? "border-primary/40 bg-primary/10 font-medium text-primary"
          : "border-border/70 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {active ? <Check className="size-3" strokeWidth={2.5} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** A tiny wireframe of each layout, used on the layout tiles. */
function LayoutGlyph({ layout }: { layout: AdsPromotionLayout }) {
  const bar = "rounded-full bg-current";
  const photo = "bg-current/25";
  switch (layout) {
    case "SPOTLIGHT":
      return (
        <div className={cn("relative h-14 w-11 overflow-hidden rounded-md", photo)}>
          <div className="absolute inset-x-1.5 bottom-1.5 grid gap-1">
            <span className={cn(bar, "h-1 w-7 opacity-80")} />
            <span className={cn(bar, "h-1 w-5 opacity-50")} />
            <span className={cn(bar, "mt-0.5 h-1.5 w-4")} />
          </div>
        </div>
      );
    case "BANNER":
      return (
        <div className={cn("relative h-9 w-16 overflow-hidden rounded-md", photo)}>
          <div className="absolute top-1/2 left-1.5 grid -translate-y-1/2 gap-1">
            <span className={cn(bar, "h-1 w-7 opacity-80")} />
            <span className={cn(bar, "h-1 w-5 opacity-50")} />
          </div>
        </div>
      );
    case "CARD":
      return (
        <div className="grid h-14 w-12 grid-rows-[1fr_auto] overflow-hidden rounded-md border border-current/25">
          <div className={photo} />
          <div className="grid gap-1 p-1.5">
            <span className={cn(bar, "h-1 w-7 opacity-80")} />
            <span className={cn(bar, "h-1 w-4 opacity-50")} />
          </div>
        </div>
      );
    case "STRIP":
      return (
        <div className="flex h-7 w-16 items-center gap-1.5 overflow-hidden rounded-md border border-current/25 pr-1.5">
          <div className={cn("h-full w-5", photo)} />
          <div className="grid flex-1 gap-1">
            <span className={cn(bar, "h-1 w-full opacity-80")} />
            <span className={cn(bar, "h-1 w-2/3 opacity-50")} />
          </div>
        </div>
      );
    case "PICKS_TILE":
      return (
        <div className={cn("relative h-14 w-10 overflow-hidden rounded-lg", photo)}>
          <div className="absolute inset-x-1 bottom-1.5 grid gap-1">
            <span className={cn(bar, "h-1 w-6 opacity-80")} />
            <span className={cn(bar, "h-1 w-4 opacity-50")} />
          </div>
        </div>
      );
  }
}

export function LayoutPicker({
  value,
  onChange,
}: {
  value: AdsPromotionLayout;
  onChange: (next: AdsPromotionLayout) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Layout" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {PROMOTION_LAYOUTS.map((layout) => {
        const active = layout === value;
        const meta = LAYOUT_META[layout];
        return (
          <button
            key={layout}
            type="button"
            role="radio"
            aria-checked={active}
            title={meta.description}
            onClick={() => onChange(layout)}
            className={cn(
              "group grid justify-items-center gap-2 rounded-xl border px-2 pt-3 pb-2.5 text-center transition",
              active
                ? "border-primary/50 bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                : "border-border/60 text-muted-foreground hover:border-border hover:bg-secondary/40 hover:text-foreground",
            )}
          >
            <span className="grid h-14 place-items-center">
              <LayoutGlyph layout={layout} />
            </span>
            <span className="text-xs font-medium">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SlotPicker({
  values,
  onChange,
  layout,
}: {
  values: AdsPromotionSlot[];
  onChange: (next: AdsPromotionSlot[]) => void;
  /** Current layout — slots that suggest a different one say so. */
  layout?: AdsPromotionLayout;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PROMOTION_SLOTS.map((slot) => {
        const active = values.includes(slot);
        const meta = SLOT_META[slot];
        return (
          <button
            key={slot}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? values.filter((item) => item !== slot) : [...values, slot])}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition",
              active
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                : "border-border/60 hover:border-border hover:bg-secondary/30",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
              )}
            >
              {active ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium text-foreground">{meta.label}</span>
                <span className="text-xs text-muted-foreground">{meta.page}</span>
                {!meta.live ? (
                  <Badge intent="outline" className="ml-auto">
                    Not on site yet
                  </Badge>
                ) : null}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{meta.where}</span>
              {active && layout && meta.suggested !== layout ? (
                <span className="text-label text-muted-foreground/90">
                  Tip: {LAYOUT_META[meta.suggested].label} fits best here
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

function ImageField({
  label,
  hint,
  value,
  onChange,
  onUpload,
  variant = "wide",
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onUpload?: PromotionUploadFn;
  variant?: "wide" | "square";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [value]);

  async function handleFile(file: File | undefined) {
    if (!file || !onUpload) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await onUpload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const frame = variant === "wide" ? "aspect-video" : "aspect-square";

  return (
    <FieldBlock label={label} hint={hint} compact>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-secondary/20 transition",
          value ? "border-border/60" : "border-dashed border-border/80",
          frame,
        )}
      >
        {value && !broken ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              onError={() => setBroken(true)}
              className={cn("absolute inset-0 size-full", variant === "wide" ? "object-cover" : "object-contain p-2")}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-ink/60 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {onUpload ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {busy ? "Uploading…" : "Replace"}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onChange(null)}
                aria-label={`Remove ${label}`}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={!onUpload || busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 grid place-content-center justify-items-center gap-1.5 p-3 text-center transition",
              onUpload ? "hover:bg-secondary/40" : "cursor-default",
            )}
          >
            <span className="grid size-9 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Icon icon={broken ? TriangleAlert : onUpload ? Upload : ImagePlus} size="sm" />
            </span>
            <span className="text-xs font-medium text-foreground">
              {busy ? "Uploading…" : broken ? "Image didn't load" : onUpload ? "Drop or browse" : "Paste a link below"}
            </span>
            {onUpload && !busy && !broken ? (
              <span className="text-label text-muted-foreground">JPG, PNG, WebP</span>
            ) : null}
          </button>
        )}
      </div>
      <div className="relative">
        <Link2
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="h-9 rounded-lg border-border/70 bg-background/60 pl-8 text-xs"
          placeholder="or paste an image URL"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || null)}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => void handleFile(event.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </FieldBlock>
  );
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function AccentField({ value, onChange }: { value: string | null; onChange: (next: string | null) => void }) {
  const current = value ?? "";
  const valid = HEX_RE.test(current);
  return (
    <FieldBlock label="Accent" hint="Colours the button" compact>
      <div className="flex flex-wrap items-center gap-2">
        {ACCENT_PRESETS.map((preset) => {
          const active = current.toLowerCase() === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={active}
              onClick={() => onChange(preset.value)}
              className={cn(
                "grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-background transition",
                active ? "ring-2 ring-foreground/60" : "hover:scale-105",
              )}
              style={{ background: preset.value }}
            >
              {active ? <Check className="size-3.5 text-paper" strokeWidth={3} aria-hidden /> : null}
            </button>
          );
        })}
        <label
          title="Custom colour"
          className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-border text-muted-foreground transition hover:text-foreground"
        >
          <Palette className="size-3.5" aria-hidden />
          <input
            type="color"
            aria-label="Custom accent colour"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={valid ? current : DEFAULT_PROMO_ACCENT}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <Input
          className="h-8 w-24 rounded-lg border-border/70 bg-background/60 font-mono text-xs"
          value={current}
          placeholder="#7c2d12"
          aria-label="Accent hex"
          onChange={(e) => onChange(e.target.value.trim() || null)}
        />
      </div>
      {current && !valid ? <p className="text-xs text-warning-fg">Use a 6-digit hex like #7c2d12</p> : null}
    </FieldBlock>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                       */
/* -------------------------------------------------------------------------- */

export function PromotionCreativeFields({
  value,
  onChange,
  onUpload,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
  /** When set, image fields accept uploads; otherwise URL paste only. */
  onUpload?: PromotionUploadFn;
}) {
  const overlayLayout = value.layout === "SPOTLIGHT" || value.layout === "BANNER" || value.layout === "PICKS_TILE";
  return (
    <Reveal className="grid gap-4" y={10}>
      <FormGroup title="Campaign" description="Internal only — helps you find it later." icon={Megaphone}>
        <Input
          className={fieldClass}
          value={value.name}
          placeholder="e.g. Kandy venues — December push"
          aria-label="Campaign name"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </FormGroup>

      <FormGroup title="Layout" description={LAYOUT_META[value.layout].description} icon={LayoutTemplate}>
        <LayoutPicker value={value.layout} onChange={(layout) => onChange({ layout })} />
      </FormGroup>

      <FormGroup title="Message" description="What couples read. Short and warm works best." icon={Type}>
        <div className="grid gap-4">
          <CountedField label="Headline" value={value.headline} max={60}>
            <Input
              className={fieldClass}
              value={value.headline}
              placeholder="Your dream Kandyan wedding, captured"
              onChange={(e) => onChange({ headline: e.target.value })}
            />
          </CountedField>
          <CountedField label="Subheadline" value={value.subheadline} max={90}>
            <Input
              className={fieldClass}
              value={value.subheadline ?? ""}
              placeholder="Optional supporting line"
              onChange={(e) => onChange({ subheadline: e.target.value || null })}
            />
          </CountedField>
          <CountedField
            label="Body"
            hint={value.layout === "STRIP" ? "Hidden in the Strip layout" : undefined}
            value={value.body}
            max={220}
          >
            <Textarea
              className="min-h-24 rounded-xl border-border/80 bg-background/70"
              value={value.body ?? ""}
              placeholder="A sentence or two about the offer"
              onChange={(e) => onChange({ body: e.target.value || null })}
            />
          </CountedField>
          <CountedField label="Badge" hint="Small tag above the headline" value={value.badgeLabel} max={20}>
            <Input
              className={fieldClass}
              value={value.badgeLabel ?? ""}
              placeholder="Featured"
              onChange={(e) => onChange({ badgeLabel: e.target.value || null })}
            />
          </CountedField>
        </div>
      </FormGroup>

      <FormGroup title="Button" description="Where a tap takes them." icon={MousePointerClick}>
        <FormGrid cols={2}>
          <CountedField label="Label" value={value.ctaLabel} max={24}>
            <Input
              className={fieldClass}
              value={value.ctaLabel ?? ""}
              placeholder="See packages"
              onChange={(e) => onChange({ ctaLabel: e.target.value || null })}
            />
          </CountedField>
          <FieldBlock label="Link" hint="A site path like /vendors or a full URL" compact>
            <Input
              className={fieldClass}
              value={value.ctaHref ?? ""}
              placeholder="/vendors"
              onChange={(e) => onChange({ ctaHref: e.target.value || null })}
            />
          </FieldBlock>
        </FormGrid>
      </FormGroup>

      <FormGroup title="Imagery" description="A bright, uncluttered photo reads best behind text." icon={ImageIcon}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ImageField
            label="Cover image"
            hint="Landscape, at least 1600px wide"
            value={value.coverUrl}
            onChange={(coverUrl) => onChange({ coverUrl })}
            onUpload={onUpload}
          />
          <div className="grid content-start gap-4">
            <ImageField
              label="Logo"
              hint="Optional, transparent PNG"
              value={value.logoUrl}
              onChange={(logoUrl) => onChange({ logoUrl })}
              onUpload={onUpload}
              variant="square"
            />
          </div>
        </div>
        <details className="group rounded-xl border border-border/50 px-3 py-2 text-sm open:pb-3">
          <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground">
            Secondary image {value.secondaryUrl ? "· added" : "(optional)"}
          </summary>
          <div className="mt-3 max-w-sm">
            <ImageField
              label="Secondary image"
              value={value.secondaryUrl}
              onChange={(secondaryUrl) => onChange({ secondaryUrl })}
              onUpload={onUpload}
            />
          </div>
        </details>
      </FormGroup>

      <FormGroup title="Style" description="Accent and text contrast." icon={Palette}>
        <div className="grid gap-4 md:grid-cols-2">
          <AccentField value={value.accentColor} onChange={(accentColor) => onChange({ accentColor })} />
          <FieldBlock
            label="Text over photo"
            hint={overlayLayout ? "Pick whichever reads clearly on your cover" : "Only applies to overlay layouts"}
            compact
          >
            <Segmented
              ariaLabel="Text over photo"
              value={value.overlayTone === "light" ? "light" : "dark"}
              onChange={(overlayTone) => onChange({ overlayTone })}
              options={[
                { value: "light", label: "Light text", description: "On a dark scrim" },
                { value: "dark", label: "Dark text", description: "On a light scrim" },
              ]}
            />
          </FieldBlock>
        </div>
      </FormGroup>
    </Reveal>
  );
}

export function PromotionTargetingFields({
  value,
  onChange,
  categoryOptions,
  children,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
  categoryOptions: Array<{ value: string; label: string }>;
  /** Extra groups (e.g. admin's linked vendor). */
  children?: ReactNode;
}) {
  const extraLocales = value.locales.filter((locale) => !LOCALE_OPTIONS.some((option) => option.value === locale));
  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];

  return (
    <Reveal className="grid gap-4" y={10}>
      <FormGroup
        title="Placements"
        description="Pick where the ad appears. You can run one creative in several places."
        icon={LayoutTemplate}
        aside={value.slots.length ? `${value.slots.length} selected` : undefined}
      >
        <SlotPicker values={value.slots} onChange={(slots) => onChange({ slots })} layout={value.layout} />
      </FormGroup>

      <FormGroup title="Audience" description="Narrow who sees it. Leave a group empty to reach everyone." icon={Users}>
        <div className="grid gap-5">
          <FieldBlock label="Cities" hint={value.cities.length ? undefined : "All cities"} compact>
            <TagInput
              values={value.cities}
              onChange={(cities) => onChange({ cities })}
              placeholder="Type a city, press Enter"
            />
            <div className="flex flex-wrap gap-1.5">
              {CITY_SUGGESTIONS.filter((city) => !value.cities.includes(city)).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => onChange({ cities: [...value.cities, city] })}
                  className="rounded-full border border-dashed border-border/80 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-border hover:text-foreground"
                >
                  + {city}
                </button>
              ))}
            </div>
          </FieldBlock>

          <FieldBlock label="Language" hint={value.locales.length ? undefined : "All languages"} compact>
            <div className="flex flex-wrap gap-1.5">
              {LOCALE_OPTIONS.map((option) => (
                <ToggleChip
                  key={option.value}
                  active={value.locales.includes(option.value)}
                  onClick={() => onChange({ locales: toggle(value.locales, option.value) })}
                >
                  {option.label}
                </ToggleChip>
              ))}
              {extraLocales.map((locale) => (
                <ToggleChip key={locale} active onClick={() => onChange({ locales: toggle(value.locales, locale) })}>
                  {locale}
                </ToggleChip>
              ))}
            </div>
          </FieldBlock>

          <FieldBlock
            label="Vendor categories"
            hint={value.categories.length ? `${value.categories.length} selected` : "All categories"}
            compact
          >
            <div className="flex flex-wrap gap-1.5">
              {categoryOptions.map((option) => (
                <ToggleChip
                  key={option.value}
                  active={value.categories.includes(option.value)}
                  onClick={() => onChange({ categories: toggle(value.categories, option.value) })}
                >
                  {option.label}
                </ToggleChip>
              ))}
            </div>
          </FieldBlock>
        </div>
      </FormGroup>

      <FormGroup
        title="Ranking"
        description="When several ads share a placement, higher priority shows first."
        icon={Sparkles}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            ariaLabel="Priority preset"
            value={value.priority >= 50 ? "50" : value.priority >= 10 ? "10" : "0"}
            onChange={(priority) => onChange({ priority: Number(priority) })}
            options={[
              { value: "0", label: "Low" },
              { value: "10", label: "Normal" },
              { value: "50", label: "High" },
            ]}
          />
          <Input
            type="number"
            aria-label="Exact priority"
            className="h-10 w-24 rounded-lg border-border/70 bg-background/60 tabular-nums"
            value={value.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) || 0 })}
          />
        </div>
      </FormGroup>

      {children}
    </Reveal>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfNextHour() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function runLength(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) return null;
  const days = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / DAY_MS);
  if (!Number.isFinite(days)) return null;
  return days;
}

export function PromotionScheduleFields({
  value,
  onChange,
  showSource = true,
  showStatus = true,
}: {
  value: AdsPromotionDraft;
  onChange: (patch: Partial<AdsPromotionDraft>) => void;
  showSource?: boolean;
  /** Vendors don't set status directly — their actions do. */
  showStatus?: boolean;
}) {
  const days = runLength(value.startsAt, value.endsAt);
  const invalidRange = days !== null && days < 0;

  function applyPreset(lengthDays: number) {
    const start = value.startsAt ? new Date(value.startsAt) : startOfNextHour();
    onChange({
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + lengthDays * DAY_MS).toISOString(),
    });
  }

  return (
    <Reveal className="grid gap-4" y={10}>
      <FormGroup
        title="Run dates"
        description="The ad only shows between these dates."
        icon={CalendarClock}
        aside={
          days !== null && !invalidRange ? (
            <span className="tabular-nums">
              {days} day{days === 1 ? "" : "s"}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {[
            { days: 7, label: "1 week" },
            { days: 14, label: "2 weeks" },
            { days: 30, label: "30 days" },
            { days: 90, label: "3 months" },
          ].map((preset) => (
            <ToggleChip key={preset.days} active={days === preset.days} onClick={() => applyPreset(preset.days)}>
              {preset.label}
            </ToggleChip>
          ))}
        </div>
        <FormGrid cols={2}>
          <FieldBlock label="Starts" compact>
            <Input
              type="datetime-local"
              className={fieldClass}
              value={toLocalInput(value.startsAt)}
              onChange={(e) => onChange({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </FieldBlock>
          <FieldBlock label="Ends" compact>
            <Input
              type="datetime-local"
              className={fieldClass}
              value={toLocalInput(value.endsAt)}
              onChange={(e) => onChange({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </FieldBlock>
        </FormGrid>
        {invalidRange ? <p className="text-xs text-destructive">The end date is before the start date.</p> : null}
      </FormGroup>

      {showStatus || showSource ? (
        <FormGroup title="Status" description={STATUS_META[value.status].description} icon={Send}>
          <div className="grid gap-4">
            {showStatus ? (
              <Segmented
                ariaLabel="Status"
                value={value.status}
                onChange={(status) => onChange({ status })}
                options={PROMOTION_STATUSES.map((status) => ({
                  value: status,
                  label: STATUS_META[status].label,
                  description: STATUS_META[status].description,
                }))}
              />
            ) : null}
            {showSource ? (
              <FieldBlock label="Source" hint={SOURCE_META[value.source].description} compact>
                <Segmented
                  ariaLabel="Source"
                  value={value.source}
                  onChange={(source) => onChange({ source })}
                  options={(Object.keys(SOURCE_META) as AdsPromotionSource[]).map((source) => ({
                    value: source,
                    label: SOURCE_META[source].label,
                  }))}
                />
              </FieldBlock>
            ) : null}
          </div>
        </FormGroup>
      ) : null}

      <FormGroup
        title="Notes"
        description={showSource ? "Internal — never shown to couples." : "Anything our team should know."}
        icon={Type}
      >
        <Textarea
          className="min-h-20 rounded-xl border-border/80 bg-background/70"
          value={value.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value || null })}
        />
      </FormGroup>
    </Reveal>
  );
}

function ReviewRow({ label, children, onEdit }: { label: string; children: ReactNode; onEdit?: () => void }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-start gap-3 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="text-xs text-primary hover:underline">
          Edit
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

/** Final step — a readable summary plus a jump-to-fix checklist. */
export function PromotionReview({
  promo,
  completeness,
  onJump,
  categoryLabel,
  readyNote = "Everything's in place — publish when you're ready.",
}: {
  promo: AdsPromotionDraft;
  completeness: Completeness;
  onJump: (section: PromotionSectionId) => void;
  categoryLabel?: (value: string) => string;
  readyNote?: string;
}) {
  const percent = Math.round((completeness.score / Math.max(completeness.total, 1)) * 100);
  const days = runLength(promo.startsAt, promo.endsAt);
  const audience = [
    promo.cities.length ? promo.cities.join(", ") : null,
    promo.locales.length
      ? promo.locales.map((l) => LOCALE_OPTIONS.find((o) => o.value === l)?.label ?? l).join(", ")
      : null,
    promo.categories.length ? promo.categories.map((c) => categoryLabel?.(c) ?? c).join(", ") : null,
  ].filter(Boolean);

  return (
    <Reveal className="grid gap-4" y={10}>
      <section
        className={cn(
          "grid gap-4 rounded-2xl border p-4 sm:p-5",
          completeness.ready ? "border-success/30 bg-success-subtle/40" : "border-border/60 bg-card/40",
        )}
      >
        <div className="flex items-center gap-4">
          <ProgressRing percent={percent} ready={completeness.ready} />
          <div className="grid gap-0.5">
            <h3 className="text-base font-medium tracking-tight">
              {completeness.ready
                ? "Ready to launch"
                : `${completeness.missing.length} thing${completeness.missing.length === 1 ? "" : "s"} left`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {completeness.ready ? readyNote : "Tap an item to jump straight to it."}
            </p>
          </div>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {Object.entries(CHECK_META).map(([key, meta]) => {
            const ok = !completeness.missing.includes(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  disabled={ok}
                  onClick={() => onJump(meta.section)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition",
                    ok ? "text-muted-foreground" : "text-foreground hover:bg-secondary/60",
                  )}
                >
                  {ok ? (
                    <span className="grid size-4.5 place-items-center rounded-full bg-success text-paper">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <Circle className="size-4.5 text-border" aria-hidden />
                  )}
                  <span className={cn(ok && "line-through decoration-muted-foreground/40")}>{meta.label}</span>
                  {!ok ? <span className="ml-auto text-xs text-primary">Fix</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <FormGroup title="Summary" icon={Megaphone}>
        <dl className="divide-y divide-border/50">
          <ReviewRow label="Campaign" onEdit={() => onJump("creative")}>
            <span className="font-medium">{promo.name || "Untitled"}</span>
            <span className="text-muted-foreground"> · {LAYOUT_META[promo.layout].label}</span>
          </ReviewRow>
          <ReviewRow label="Placements" onEdit={() => onJump("targeting")}>
            {promo.slots.length ? (
              <span className="flex flex-wrap gap-1">
                {promo.slots.map((slot) => (
                  <Badge key={slot} intent={SLOT_META[slot].live ? "default" : "outline"}>
                    {SLOT_META[slot].label}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">None yet</span>
            )}
          </ReviewRow>
          <ReviewRow label="Audience" onEdit={() => onJump("targeting")}>
            {audience.length ? audience.join(" · ") : <span className="text-muted-foreground">Everyone</span>}
          </ReviewRow>
          <ReviewRow label="Runs" onEdit={() => onJump("schedule")}>
            {promo.startsAt && promo.endsAt ? (
              <>
                {formatDate(promo.startsAt)} → {formatDate(promo.endsAt)}
                {days !== null && days >= 0 ? <span className="text-muted-foreground"> · {days} days</span> : null}
              </>
            ) : (
              <span className="text-muted-foreground">Not scheduled</span>
            )}
          </ReviewRow>
          <ReviewRow label="Status">
            <PromotionStatusBadge status={promo.status} />
          </ReviewRow>
        </dl>
      </FormGroup>
    </Reveal>
  );
}

function ProgressRing({ percent, ready }: { percent: number; ready: boolean }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-secondary" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={cn("transition-[stroke-dashoffset] duration-500", ready ? "stroke-success" : "stroke-primary")}
        />
      </svg>
      {ready ? (
        <Check className="size-5 text-success" strokeWidth={2.5} aria-hidden />
      ) : (
        <span className="text-label font-medium tabular-nums">{percent}%</span>
      )}
    </span>
  );
}

/** Compact progress readout for the sticky action bar. */
export function PromotionProgress({
  completeness,
  status,
}: {
  completeness: Completeness;
  status: AdsPromotionStatus;
}) {
  const percent = Math.round((completeness.score / Math.max(completeness.total, 1)) * 100);
  return (
    <div className="mr-auto flex min-w-0 items-center gap-3">
      <PromotionStatusBadge status={status} />
      <div className="hidden w-28 gap-1 sm:grid">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              completeness.ready ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <span className="truncate text-xs text-muted-foreground tabular-nums">
        {completeness.ready ? "Ready" : `${completeness.score}/${completeness.total} ready`}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                     */
/* -------------------------------------------------------------------------- */

function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block rounded-md bg-foreground/8", className)} />;
}

function SlotContext({ slot, children }: { slot: AdsPromotionSlot | null; children: ReactNode }) {
  const meta = slot ? SLOT_META[slot] : null;
  const search = slot === "CATALOG_TOP" || slot === "CATALOG_INLINE";
  return (
    <div className="grid gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-2.5 w-16" />
        <div className="flex gap-1">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="size-2.5 rounded-full" />
        </div>
      </div>
      {search ? (
        <Skeleton className="h-8 rounded-lg" />
      ) : (
        <div className="grid gap-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      )}
      {slot === "CATALOG_INLINE" ? <ResultSkeleton /> : null}
      <div className="grid gap-1">
        <span className="text-label tracking-label text-muted-foreground/80 uppercase">Sponsored</span>
        {children}
      </div>
      {search ? (
        <>
          <ResultSkeleton />
          <ResultSkeleton />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="aspect-[4/5] rounded-xl" />
          <Skeleton className="aspect-[4/5] rounded-xl" />
        </div>
      )}
      {meta ? (
        <p className="text-center text-label text-muted-foreground">
          {meta.page} · {meta.where}
        </p>
      ) : null}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex gap-2.5">
      <Skeleton className="size-14 shrink-0 rounded-xl" />
      <div className="grid flex-1 content-center gap-1.5">
        <Skeleton className="h-2.5 w-2/3" />
        <Skeleton className="h-2 w-1/3" />
      </div>
    </div>
  );
}

export function PromotionPreview({
  promo,
  slotHint,
}: {
  promo: AdsPromotionDraft;
  /** @deprecated The preview now shows placements itself. */
  slotHint?: string;
}) {
  const [slot, setSlot] = useState<AdsPromotionSlot | null>(promo.slots[0] ?? null);
  const activeSlot = slot && promo.slots.includes(slot) ? slot : (promo.slots[0] ?? null);
  void slotHint;

  return (
    <div className="grid gap-2 pt-1">
      {promo.slots.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto px-2 pt-1 [scrollbar-width:none]">
          {promo.slots.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSlot(item)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs transition",
                item === activeSlot ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {SLOT_META[item].label}
            </button>
          ))}
        </div>
      ) : null}
      <SlotContext slot={activeSlot}>
        <PromotionCreative
          promo={promo}
          light={promo.overlayTone === "light"}
          className="rounded-2xl"
          style={{
            ["--promo-accent" as string]: HEX_RE.test(promo.accentColor ?? "")
              ? promo.accentColor!
              : "var(--color-primary)",
          }}
        />
      </SlotContext>
      {!activeSlot ? (
        <p className="px-3 pb-2 text-center text-xs text-muted-foreground">Pick a placement to see it in context.</p>
      ) : null}
    </div>
  );
}

/** Thumbnail + name + headline, for campaign tables. */
export function PromotionRowSummary({
  promo,
}: {
  promo: Pick<AdsPromotionDraft, "name" | "headline" | "coverUrl" | "layout">;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {promo.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImageIcon className="size-4" aria-hidden />
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate font-medium">{promo.name || "Untitled"}</span>
        <span className="truncate text-xs text-muted-foreground">
          {LAYOUT_META[promo.layout]?.label ?? promo.layout} · {promo.headline}
        </span>
      </span>
    </div>
  );
}

/** Impressions, clicks and click-through rate. */
export function PromotionPerf({ impressions, clicks }: { impressions: number; clicks: number }) {
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
  return (
    <div className="grid gap-0.5 text-xs tabular-nums">
      <span>
        <span className="font-medium text-foreground">{impressions.toLocaleString()}</span>{" "}
        <span className="text-muted-foreground">views</span>
        <span className="text-muted-foreground"> · </span>
        <span className="font-medium text-foreground">{clicks.toLocaleString()}</span>{" "}
        <span className="text-muted-foreground">clicks</span>
      </span>
      <span className="text-muted-foreground">{ctr === null ? "No views yet" : `${ctr.toFixed(1)}% CTR`}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The creative itself — shared by the studio preview and the public site      */
/* -------------------------------------------------------------------------- */

export function PromotionCreative({
  promo,
  className,
  style,
  light,
  action,
}: {
  promo: Pick<
    AdsPromotionDraft,
    "layout" | "headline" | "subheadline" | "body" | "ctaLabel" | "coverUrl" | "logoUrl" | "badgeLabel" | "vendorName"
  >;
  className?: string;
  style?: CSSProperties;
  light?: boolean;
  action?: ReactNode;
}) {
  const { layout } = promo;
  const overlay = layout === "SPOTLIGHT" || layout === "BANNER" || layout === "PICKS_TILE";
  const isStrip = layout === "STRIP";
  const compact = layout === "PICKS_TILE";

  const photo = promo.coverUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={promo.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
  ) : (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-secondary to-muted text-muted-foreground/50">
      <ImageIcon className="size-6" aria-hidden />
    </div>
  );

  const cta = promo.ctaLabel ? (
    <span
      className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-paper shadow-sm"
      style={{ background: "var(--promo-accent, var(--color-primary))" }}
    >
      {promo.ctaLabel}
    </span>
  ) : null;

  const meta =
    promo.badgeLabel || promo.vendorName || promo.logoUrl ? (
      <div className="flex flex-wrap items-center gap-2">
        {promo.badgeLabel ? <Badge intent="love">{promo.badgeLabel}</Badge> : null}
        {promo.vendorName ? <span className="text-xs opacity-80">{promo.vendorName}</span> : null}
        {promo.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.logoUrl} alt="" className="ml-auto h-7 w-auto rounded-md bg-paper/90 p-1" />
        ) : null}
      </div>
    ) : null;

  if (isStrip) {
    return (
      <article
        data-slot="promotion-creative"
        data-layout={layout}
        className={cn(
          "relative grid grid-cols-[5.5rem_minmax(0,1fr)] items-stretch overflow-hidden border border-border/60 bg-card text-foreground shadow-sm sm:grid-cols-[8rem_minmax(0,1fr)_auto]",
          className,
        )}
        style={style}
      >
        <div className="relative min-h-20 overflow-hidden">{photo}</div>
        <div className="grid min-w-0 content-center gap-1 p-3">
          {meta}
          <h3 className="truncate font-serif text-lg leading-tight tracking-tight">{promo.headline || "Headline"}</h3>
          {promo.subheadline ? <p className="truncate text-xs text-muted-foreground">{promo.subheadline}</p> : null}
          <div className="sm:hidden">{cta}</div>
        </div>
        <div className="hidden items-center gap-2 pr-4 sm:flex">
          {cta}
          {action}
        </div>
      </article>
    );
  }

  if (!overlay) {
    return (
      <article
        data-slot="promotion-creative"
        data-layout={layout}
        className={cn(
          "relative grid overflow-hidden border border-border/60 bg-card text-foreground shadow-sm",
          className,
        )}
        style={style}
      >
        <div className="relative aspect-[16/10] overflow-hidden">{photo}</div>
        <div className="grid gap-2 p-4">
          {meta}
          <h3 className="font-serif text-xl leading-snug tracking-tight">{promo.headline || "Headline"}</h3>
          {promo.subheadline ? <p className="text-sm text-muted-foreground">{promo.subheadline}</p> : null}
          {promo.body ? <p className="line-clamp-3 text-sm text-muted-foreground">{promo.body}</p> : null}
          {cta || action ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {cta}
              {action}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  const banner = layout === "BANNER";
  return (
    <article
      data-slot="promotion-creative"
      data-layout={layout}
      className={cn(
        "relative isolate flex overflow-hidden border border-border/60 bg-card shadow-sm",
        layout === "SPOTLIGHT" && "min-h-80",
        banner && "min-h-52",
        compact && "aspect-[4/5]",
        light ? "text-paper" : "text-ink",
        className,
      )}
      style={style}
    >
      {photo}
      <div
        className={cn(
          "absolute inset-0",
          banner ? "bg-gradient-to-r" : "bg-gradient-to-t",
          light ? "from-ink/80 via-ink/40 to-transparent" : "from-paper/95 via-paper/60 to-transparent",
        )}
      />
      <div
        className={cn(
          "relative flex w-full flex-col gap-2",
          banner ? "max-w-md justify-center p-5 sm:p-6" : "justify-end",
          compact ? "p-3.5" : !banner && "p-5",
        )}
      >
        {meta}
        <h3
          className={cn(
            "font-serif leading-tight tracking-tight",
            layout === "SPOTLIGHT" ? "text-3xl" : compact ? "text-lg" : "text-2xl",
          )}
        >
          {promo.headline || "Headline"}
        </h3>
        {promo.subheadline ? (
          <p className={cn("opacity-90", compact ? "text-xs" : "text-sm")}>{promo.subheadline}</p>
        ) : null}
        {promo.body && !compact ? <p className="line-clamp-3 text-sm opacity-80">{promo.body}</p> : null}
        {cta || action ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {cta}
            {action}
          </div>
        ) : null}
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
    accentColor: DEFAULT_PROMO_ACCENT,
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
