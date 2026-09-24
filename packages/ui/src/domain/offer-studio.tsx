"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { SimpleSelect } from "../components/select";
import { Textarea } from "../components/textarea";
import { Icon } from "../components/icon";
import { cn } from "../lib/utils";
import { FieldBlock, FormGrid, StudioCollapse, TagInput } from "./creator-form";
import { PackageCompare, type PackageCompareItem } from "./package-compare";
import { TrustMarks } from "./trust-marks";
import { VendorGallery } from "./vendor-gallery";
import { Reveal } from "./motion";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";

function websiteHref(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function websiteHost(value?: string | null) {
  const href = websiteHref(value);
  if (!href) return "";
  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

export function StudioPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "grid gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-background/70 to-background/30 p-4 md:p-5",
        className,
      )}
      y={10}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div className="grid gap-0.5">
          <h3 className="font-medium tracking-tight">{title}</h3>
          {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Reveal>
  );
}

export { MediaListEditor, MediaStudioEditor } from "./media-studio";
export type { MediaStudioProject, MediaStudioVideo, MediaUploadFn } from "./media-studio";

export type AddOnEditorItem = {
  key: string;
  name: string;
  pricingMode: string;
  priceLkr?: number | null;
  description?: string | null;
};

export function AddOnEditor({
  items,
  pricingModes,
  onChange,
  onAdd,
  onRemove,
}: {
  items: AddOnEditorItem[];
  pricingModes: readonly string[];
  onChange: (index: number, next: AddOnEditorItem) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <StudioPanel
      title="Add-ons library"
      description="Extras couples can attach (hour, album, trial…)."
      action={
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Icon icon={Plus} size="sm" />
          Add add-on
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No add-ons yet — optional, but they lift average inquiry value.</p>
      ) : null}
      <div className="grid gap-3">
        {items.map((addOn, index) => (
          <div
            key={addOn.key}
            className="grid gap-3 rounded-xl border border-border/60 bg-card/50 p-3 sm:grid-cols-[1fr_9rem_8rem_auto] sm:items-end"
          >
            <FieldBlock label="Name" compact>
              <Input
                className={fieldClass}
                value={addOn.name}
                onChange={(e) => onChange(index, { ...addOn, name: e.target.value })}
                placeholder="Add-on name"
              />
            </FieldBlock>
            <FieldBlock label="Mode" compact>
              <SimpleSelect
                className={fieldClass}
                value={addOn.pricingMode}
                onValueChange={(pricingMode) => onChange(index, { ...addOn, pricingMode })}
                options={pricingModes.map((value) => ({ value, label: value }))}
              />
            </FieldBlock>
            <FieldBlock label="Price" compact>
              <Input
                className={fieldClass}
                type="number"
                value={addOn.priceLkr ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    ...addOn,
                    priceLkr: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="LKR"
              />
            </FieldBlock>
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onRemove(index)}>
              <Icon icon={Trash2} size="sm" />
            </Button>
          </div>
        ))}
      </div>
    </StudioPanel>
  );
}

export type PackageCardEditorItem = {
  id?: string;
  name: string;
  status: string;
  pricingMode: string;
  priceLkr: number | null;
  priceMaxLkr: number | null;
  badge: string | null;
  description: string | null;
  inclusions: string[];
  exclusions: string[];
  eventTypes: string[];
  durationHours: number | null;
  guestMin: number | null;
  guestMax: number | null;
  photoUrls: string[];
  bestFor: string | null;
  addOnIds: string[];
};

export type PackageAddOnOption = { key: string; id?: string; clientKey?: string; name: string };

export function PackageCardEditor({
  index,
  pkg,
  statusOptions,
  pricingModes,
  badgeOptions,
  eventTypeOptions,
  addOnOptions,
  onChange,
  onRemove,
}: {
  index: number;
  pkg: PackageCardEditorItem;
  statusOptions: readonly string[];
  pricingModes: readonly string[];
  badgeOptions: readonly string[];
  eventTypeOptions: readonly string[];
  addOnOptions: PackageAddOnOption[];
  onChange: (next: PackageCardEditorItem) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(pkg.priceLkr == null);
  const subtitle = [
    pkg.status.replaceAll("_", " "),
    pkg.badge ? pkg.badge.replaceAll("_", " ") : null,
    pkg.priceLkr != null ? `LKR ${pkg.priceLkr.toLocaleString("en-LK")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <StudioCollapse
      open={open}
      onOpenChange={setOpen}
      title={pkg.name.trim() || `Package ${index + 1}`}
      subtitle={subtitle}
      action={
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Icon icon={Trash2} size="sm" />
          Remove
        </Button>
      }
    >
        <FormGrid cols={2}>
          <FieldBlock label="Name">
            <Input className={fieldClass} value={pkg.name} onChange={(e) => onChange({ ...pkg, name: e.target.value })} />
          </FieldBlock>
          <FieldBlock label="Status">
            <SimpleSelect
              className={fieldClass}
              value={pkg.status}
              onValueChange={(status) => onChange({ ...pkg, status })}
              options={statusOptions.map((value) => ({ value, label: value }))}
            />
          </FieldBlock>
        </FormGrid>

        <FormGrid cols={3}>
          <FieldBlock label="Pricing mode">
            <SimpleSelect
              className={fieldClass}
              value={pkg.pricingMode}
              onValueChange={(pricingMode) => onChange({ ...pkg, pricingMode })}
              options={pricingModes.map((value) => ({ value, label: value }))}
            />
          </FieldBlock>
          <FieldBlock label="Price (LKR)">
            <Input
              className={fieldClass}
              type="number"
              value={pkg.priceLkr ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, priceLkr: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FieldBlock>
          <FieldBlock label="Max price (range)">
            <Input
              className={fieldClass}
              type="number"
              value={pkg.priceMaxLkr ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, priceMaxLkr: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FieldBlock>
        </FormGrid>

        <FormGrid cols={2}>
          <FieldBlock label="Badge">
            <SimpleSelect
              className={fieldClass}
              value={pkg.badge ?? "none"}
              onValueChange={(value) => onChange({ ...pkg, badge: value === "none" ? null : value })}
              options={[
                { value: "none", label: "None" },
                ...badgeOptions.map((value) => ({ value, label: value })),
              ]}
            />
          </FieldBlock>
          <FieldBlock label="Best for" hint="One line: who this package is perfect for.">
            <Input
              className={fieldClass}
              value={pkg.bestFor ?? ""}
              onChange={(e) => onChange({ ...pkg, bestFor: e.target.value || null })}
              placeholder="Intimate Kandyan home wedding"
            />
          </FieldBlock>
        </FormGrid>

        <FormGrid cols={3}>
          <FieldBlock label="Duration (hours)">
            <Input
              className={fieldClass}
              type="number"
              min={0}
              value={pkg.durationHours ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, durationHours: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FieldBlock>
          <FieldBlock label="Guests min">
            <Input
              className={fieldClass}
              type="number"
              min={0}
              value={pkg.guestMin ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, guestMin: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FieldBlock>
          <FieldBlock label="Guests max">
            <Input
              className={fieldClass}
              type="number"
              min={0}
              value={pkg.guestMax ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, guestMax: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FieldBlock>
        </FormGrid>

        <FieldBlock label="Description">
          <Textarea
            value={pkg.description ?? ""}
            onChange={(e) => onChange({ ...pkg, description: e.target.value })}
            className="min-h-28"
          />
        </FieldBlock>

        <FormGrid cols={2}>
          <FieldBlock label="Inclusions">
            <TagInput values={pkg.inclusions} onChange={(inclusions) => onChange({ ...pkg, inclusions })} />
          </FieldBlock>
          <FieldBlock label="Exclusions">
            <TagInput values={pkg.exclusions} onChange={(exclusions) => onChange({ ...pkg, exclusions })} />
          </FieldBlock>
        </FormGrid>

        <FieldBlock label="Package photos" hint="1–3 image URLs that sell this specific offer.">
          <TagInput
            values={pkg.photoUrls}
            onChange={(photoUrls) => onChange({ ...pkg, photoUrls })}
            placeholder="Paste package image URL"
          />
        </FieldBlock>

        {addOnOptions.length ? (
          <FieldBlock label="Attached add-ons">
            <div className="flex flex-wrap gap-2">
              {addOnOptions.map((addOn) => {
                const ref = addOn.clientKey ?? addOn.id ?? addOn.key;
                const selected = pkg.addOnIds.some(
                  (id) => id === ref || id === addOn.id || id === addOn.key,
                );
                return (
                  <button
                    key={addOn.key}
                    type="button"
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs transition",
                      selected
                        ? "border-primary/40 bg-primary text-primary-foreground"
                        : "border-border/70 bg-secondary/70 text-foreground hover:border-primary/30",
                    )}
                    onClick={() => {
                      const addOnIds = selected
                        ? pkg.addOnIds.filter((id) => id !== ref && id !== addOn.id && id !== addOn.key)
                        : [...pkg.addOnIds, ref];
                      onChange({ ...pkg, addOnIds });
                    }}
                  >
                    {addOn.name}
                  </button>
                );
              })}
            </div>
          </FieldBlock>
        ) : null}

        <FieldBlock label="Event types">
          <div className="flex flex-wrap gap-2">
            {eventTypeOptions.map((value) => {
              const selected = pkg.eventTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs transition",
                    selected
                      ? "border-primary/40 bg-primary text-primary-foreground"
                      : "border-border/70 bg-secondary/70 text-foreground hover:border-primary/30",
                  )}
                  onClick={() => {
                    const eventTypes = selected
                      ? pkg.eventTypes.filter((item) => item !== value)
                      : [...pkg.eventTypes, value];
                    onChange({ ...pkg, eventTypes });
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </FieldBlock>
    </StudioCollapse>
  );
}

export function FaqEditor({
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  items: Array<{ question: string; answer: string }>;
  onChange: (index: number, next: { question: string; answer: string }) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  function isOpen(index: number) {
    if (open[index] !== undefined) return open[index];
    return !items[index]?.question.trim();
  }

  return (
    <div className="grid gap-3">
      {items.map((faq, index) => (
        <StudioCollapse
          key={index}
          open={isOpen(index)}
          onOpenChange={(next) => setOpen((current) => ({ ...current, [index]: next }))}
          title={faq.question.trim() || `Question ${index + 1}`}
          subtitle={faq.answer.trim() || "Add an answer"}
          action={
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
              Remove
            </Button>
          }
        >
          <FieldBlock label="Question">
            <Input
              className={fieldClass}
              value={faq.question}
              placeholder="Question"
              onChange={(e) => onChange(index, { ...faq, question: e.target.value })}
            />
          </FieldBlock>
          <FieldBlock label="Answer">
            <Textarea
              value={faq.answer}
              placeholder="Answer"
              onChange={(e) => onChange(index, { ...faq, answer: e.target.value })}
            />
          </FieldBlock>
        </StudioCollapse>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setOpen((current) => ({ ...current, [items.length]: true }));
          onAdd();
        }}
      >
        <Icon icon={Plus} size="sm" />
        Add FAQ
      </Button>
    </div>
  );
}

export function StorefrontPreview({
  name,
  city,
  district,
  offerHeadline,
  photos,
  coverUrl,
  cinematic,
  verified,
  featured,
  destination,
  packages,
  projects,
  introVideoUrl,
  videos,
  listed = true,
  showPricing = true,
  websiteUrl,
}: {
  name: string;
  city: string;
  district: string;
  offerHeadline?: string | null;
  photos: string[];
  coverUrl?: string | null;
  cinematic?: "default" | "venue" | "portrait" | "detail";
  verified?: boolean;
  featured?: boolean;
  destination?: boolean;
  packages: PackageCompareItem[];
  completeness?: { score: number; total: number } | null;
  projects?: Array<{
    id: string;
    title: string;
    coverUrl?: string | null;
    items: Array<{ url: string }>;
  }>;
  introVideoUrl?: string | null;
  videos?: Array<{ id: string; url: string; title?: string | null }>;
  listed?: boolean;
  showPricing?: boolean;
  websiteUrl?: string | null;
}) {
  const siteHref = websiteHref(websiteUrl);
  return (
    <div className="grid gap-4 pt-1">
      {listed === false ? (
        <div className="rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2.5 text-sm">
          <p className="font-medium">Private listing</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hidden from search and the catalog. Couples with your link can still open this page.
          </p>
        </div>
      ) : null}
      {showPricing === false ? (
        <div className="rounded-2xl border border-border/70 bg-card/70 px-3 py-2.5 text-sm">
          <p className="font-medium text-primary">Inquire for pricing</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Guests see this instead of LKR amounts. Package inclusions still show.
          </p>
        </div>
      ) : null}
      <VendorGallery
        name={name}
        photos={photos}
        coverUrl={coverUrl}
        cinematic={cinematic}
        projects={projects}
        introVideoUrl={introVideoUrl}
        videos={videos}
      />
      <div className="grid gap-2 px-0.5">
        <TrustMarks verified={verified} featured={featured} destination={destination} />
        <p className="font-serif text-2xl leading-tight tracking-tight">{name}</p>
        <p className="text-sm text-muted-foreground">
          {city}, {district}
        </p>
        {siteHref ? (
          <a
            href={siteHref}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-sm text-primary underline-offset-2 hover:underline"
          >
            {websiteHost(websiteUrl)}
          </a>
        ) : null}
        {offerHeadline ? <p className="text-sm leading-relaxed">{offerHeadline}</p> : null}
      </div>
      <div className="max-h-[28rem] overflow-y-auto pr-1">
        <PackageCompare packages={packages} className="xl:grid-cols-1" />
      </div>
    </div>
  );
}

export function InquirePanel({
  title,
  children,
  footer,
  className,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      data-slot="inquire-panel"
      className={cn(
        "grid gap-4 rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-secondary/20 p-5 shadow-card md:p-6",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-500",
        className,
      )}
    >
      <div className="grid gap-1">
        <p className="text-[11px] font-medium tracking-[0.18em] text-primary/90 uppercase">Inquire</p>
        <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      </div>
      {children}
      {footer}
    </aside>
  );
}

export function VendorStatStrip({
  rating,
  couplesServed,
  yearsExperience,
  couplesLabel,
  yearsLabel,
}: {
  rating: string;
  couplesServed: number;
  yearsExperience: number;
  couplesLabel: string;
  yearsLabel: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/70 bg-card/60 p-3 text-center sm:gap-4 sm:p-4">
      <div className="grid gap-0.5">
        <p className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">★ {rating}</p>
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase sm:text-xs">Rating</p>
      </div>
      <div className="grid gap-0.5 border-x border-border/60">
        <p className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">{couplesServed}</p>
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase sm:text-xs">{couplesLabel}</p>
      </div>
      <div className="grid gap-0.5">
        <p className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">{yearsExperience}</p>
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase sm:text-xs">{yearsLabel}</p>
      </div>
    </div>
  );
}
