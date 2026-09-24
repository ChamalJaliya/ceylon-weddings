"use client";

import type { ReactNode } from "react";
import { GuestVendorCredit } from "./team-vendor";
import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { motion, useReducedMotion, Stagger, StaggerItem, Reveal, AnimatedCollapsible, InteractiveCard } from "./motion";

export function CoupleIdentity({
  names,
  date,
  place,
  styleLabel,
  className,
}: {
  names: string;
  date?: string | null;
  place?: string | null;
  styleLabel?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <h2 className="font-serif text-3xl leading-tight font-semibold sm:text-4xl">{names}</h2>
      <p className="text-sm text-muted-foreground">
        {[date, place, styleLabel].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

export function GuestSiteHero({
  imageSrc,
  names,
  date,
  place,
  kicker = "You're invited",
  actions,
}: {
  imageSrc: string;
  names: string;
  date?: string | null;
  place?: string | null;
  kicker?: string;
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate min-h-[28rem] overflow-hidden rounded-[2rem] sm:min-h-[34rem]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={imageSrc}
        alt=""
        className="absolute inset-0 size-full object-cover"
        initial={reduce ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/35" />
      <div className="relative flex min-h-[28rem] flex-col justify-end px-6 py-10 sm:min-h-[34rem] sm:px-10 sm:py-14">
        <Stagger className="max-w-2xl" stagger={0.08}>
          <StaggerItem>
            <p className="text-[11px] tracking-[0.28em] text-hero-muted uppercase">{kicker}</p>
          </StaggerItem>
          <StaggerItem>
            <h1 className="mt-3 font-serif text-4xl leading-[0.95] font-semibold text-hero-foreground sm:text-6xl">
              {names}
            </h1>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-5 h-px w-16 bg-primary" />
          </StaggerItem>
          {(date || place) && (
            <StaggerItem>
              <p className="mt-4 text-sm text-hero-muted">{[date, place].filter(Boolean).join(" · ")}</p>
            </StaggerItem>
          )}
          {actions ? (
            <StaggerItem>
              <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
            </StaggerItem>
          ) : null}
        </Stagger>
      </div>
    </section>
  );
}

export function CeremonySchedule({
  events,
  formatWhen,
}: {
  events: Array<{
    id: string;
    name: string;
    kind: string;
    startsAt?: string | null;
    nekathAt?: string | null;
    venueName?: string | null;
    address?: string | null;
  }>;
  formatWhen: (iso: string | null | undefined) => string;
}) {
  if (!events.length) return null;
  return (
    <Stagger className="grid gap-4" stagger={0.07}>
      {events.map((event) => (
        <StaggerItem key={event.id}>
          <div className="grid gap-2 rounded-3xl border border-border/50 bg-secondary/20 px-5 py-4 transition duration-300 hover:border-border hover:bg-secondary/35">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-serif text-xl">{event.name}</p>
              <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                {event.kind}
              </span>
            </div>
            {event.nekathAt ? (
              <p className="text-sm text-muted-foreground">Nekath · {formatWhen(event.nekathAt)}</p>
            ) : null}
            {event.startsAt ? <p className="text-sm">{formatWhen(event.startsAt)}</p> : null}
            {(event.venueName || event.address) && (
              <p className="text-sm text-muted-foreground">
                {[event.venueName, event.address].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function FaqAccordion({ faq }: { faq: string | null | undefined }) {
  if (!faq?.trim()) return null;
  const blocks = faq
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <Stagger className="grid gap-3" stagger={0.06}>
      {blocks.map((block) => {
        const [title, ...rest] = block.split("\n");
        return (
          <StaggerItem key={block.slice(0, 40)}>
            <details
              className="group rounded-2xl border border-border/70 bg-card/30 px-4 py-3 transition-colors duration-200 hover:border-border hover:bg-card/50"
              open={blocks.length === 1}
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                {title}
                <motion.span
                  className="ml-2 shrink-0 text-muted-foreground"
                  style={{ display: "inline-block" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-open:rotate-180">
                    <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </summary>
              {rest.length ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {rest.join("\n")}
                </p>
              ) : null}
            </details>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}


export function TravelGuideBlock({ notes }: { notes: string | null | undefined }) {
  if (!notes?.trim()) return null;
  return (
    <Reveal direction="up" y={18}>
      <div className="rounded-3xl border border-border/70 bg-card/40 px-5 py-5">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Travel</p>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{notes}</p>
      </div>
    </Reveal>
  );
}

export function OurTeamStrip({
  items,
  catalogHref,
}: {
  items: Array<{
    vendorId: string;
    name: string;
    slug: string;
    category: string;
    photoUrl?: string | null;
  }>;
  catalogHref?: (slug: string) => string;
}) {
  if (!items.length) return null;
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
      {items.map((item) => (
        <StaggerItem key={item.vendorId} direction="up" y={16}>
          <GuestVendorCredit
            name={item.name}
            category={item.category}
            photoUrl={item.photoUrl}
            href={catalogHref?.(item.slug)}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function PlateSummaryCard({
  title,
  estimate,
  confirmed,
  considering,
  bufferGap,
  byMeal,
}: {
  title: string;
  estimate: number;
  confirmed: number;
  considering: number;
  bufferGap: number;
  byMeal: Array<{ meal: string | null; heads: number }>;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/40 p-5">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{title}</p>
        <p className="mt-2 font-serif text-3xl">
          {confirmed}
          <span className="text-lg text-muted-foreground"> / {estimate}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {considering} considering · buffer {bufferGap >= 0 ? `+${bufferGap}` : bufferGap}
        </p>
      </div>
      {byMeal.length ? (
        <ul className="grid gap-1.5 text-sm">
          {byMeal.map((row) => (
            <li key={String(row.meal)} className="flex justify-between">
              <span className="text-muted-foreground">{row.meal ?? "Unset"}</span>
              <span>{row.heads}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PayerPots({
  title,
  pots,
  formatMoney,
}: {
  title: string;
  pots: Array<{
    payer: string;
    plannedLkr: number;
    spentLkr: number;
    paidLkr: number;
    unpaidLkr: number;
  }>;
  formatMoney: (value: number) => string;
}) {
  const labels: Record<string, string> = {
    COUPLE: "Couple",
    BRIDE_FAMILY: "Bride family",
    GROOM_FAMILY: "Groom family",
  };
  return (
    <div className="grid gap-3">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{title}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {pots.map((pot) => (
          <div key={pot.payer} className="rounded-2xl border border-border/70 bg-card/40 p-4">
            <p className="text-sm font-medium">{labels[pot.payer] ?? pot.payer}</p>
            <p className="mt-2 font-serif text-xl">{formatMoney(pot.plannedLkr)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Spent {formatMoney(pot.spentLkr)} · unpaid {formatMoney(pot.unpaidLkr)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RsvpSummaryStrip({
  confirmed,
  total,
  byStatus,
}: {
  confirmed: number;
  total: number;
  byStatus: Array<{ status: string; households: number }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/30 px-4 py-3">
      <p className="font-serif text-xl">
        {confirmed}
        <span className="text-sm text-muted-foreground"> / {total} confirmed</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {byStatus.map((row) => (
          <span
            key={row.status}
            className="rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] tracking-wide uppercase"
          >
            {row.status} {row.households}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ShareInvitePanel({
  url,
  whatsappUrl,
  onCopy,
  copied,
}: {
  url: string;
  whatsappUrl?: string | null;
  onCopy: () => void;
  copied?: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/40 p-5">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Share</p>
      <p className="truncate font-mono text-xs text-muted-foreground">{url}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onCopy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
        {whatsappUrl ? (
          <Button type="button" variant="outline" asChild>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function TeamGapBanner({
  missing,
  labels,
  action,
}: {
  missing: string[];
  labels: Record<string, string>;
  action?: ReactNode;
}) {
  if (!missing.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
      <p className="text-sm">
        Still need: {missing.map((key) => labels[key] ?? key).join(", ")}
      </p>
      {action}
    </div>
  );
}

export function PlanningProgress({
  score,
  total,
  missing,
  labels,
  title = "Wedding readiness",
}: {
  score: number;
  total: number;
  missing: string[];
  labels?: Record<string, string>;
  title?: string;
}) {
  const percent = total ? Math.round((score / total) * 100) : 0;
  const ready = missing.length === 0;
  return (
    <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/40 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{title}</p>
          <p className="mt-1 font-serif text-3xl">{percent}%</p>
        </div>
        <p className={cn("text-sm", ready ? "text-primary" : "text-muted-foreground")}>
          {score}/{total}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      {missing.length ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Still need: {missing.map((key) => labels?.[key] ?? key).join(" · ")}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Ready to share with guests.</p>
      )}
    </div>
  );
}

export function WeddingSitePreview({
  names,
  date,
  place,
  imageSrc,
  events,
  faq,
  travelNotes,
  team,
  formatWhen,
  rsvpHref,
}: {
  names: string;
  date?: string | null;
  place?: string | null;
  imageSrc: string;
  events: Array<{
    id: string;
    name: string;
    kind: string;
    startsAt?: string | null;
    nekathAt?: string | null;
    venueName?: string | null;
    address?: string | null;
  }>;
  faq?: string | null;
  travelNotes?: string | null;
  team?: Array<{
    vendorId: string;
    name: string;
    slug: string;
    category: string;
    photoUrl?: string | null;
  }>;
  formatWhen: (iso: string | null | undefined) => string;
  rsvpHref?: string;
}) {
  return (
    <div className="grid gap-6">
      <GuestSiteHero
        imageSrc={imageSrc}
        names={names}
        date={date}
        place={place}
        actions={
          rsvpHref ? (
            <Button asChild>
              <a href={rsvpHref}>RSVP</a>
            </Button>
          ) : undefined
        }
      />
      <section className="grid gap-3">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Ceremony</p>
        <CeremonySchedule events={events} formatWhen={formatWhen} />
      </section>
      {travelNotes ? <TravelGuideBlock notes={travelNotes} /> : null}
      {faq ? (
        <section className="grid gap-3">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">FAQ</p>
          <FaqAccordion faq={faq} />
        </section>
      ) : null}
      {team?.length ? (
        <section className="grid gap-3">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Our team</p>
          <OurTeamStrip items={team} />
        </section>
      ) : null}
    </div>
  );
}

export function StyleStoryPicker({
  value,
  options,
  onChange,
  colors,
}: {
  value: string;
  options: Array<{ value: string; label: string; swatches: string[] }>;
  onChange: (value: string) => void;
  colors?: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-3xl border px-4 py-4 text-left transition",
              active ? "border-primary bg-primary/5" : "border-border/70 bg-card/30 hover:border-border",
            )}
          >
            <p className="font-serif text-lg">{option.label}</p>
            <div className="mt-3 flex gap-1.5">
              {(colors && active ? colors : option.swatches).slice(0, 5).map((swatch) => (
                <span
                  key={swatch}
                  className="size-5 rounded-full border border-border/50"
                  style={{ background: swatch }}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function EventCeremonyCard({
  children,
  title,
  kind,
  onRemove,
}: {
  children: ReactNode;
  title: string;
  kind: string;
  onRemove?: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-border/70 bg-card/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{kind}</p>
          <p className="font-serif text-xl">{title}</p>
        </div>
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
