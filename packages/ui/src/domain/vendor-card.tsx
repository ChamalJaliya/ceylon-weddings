"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Badge } from "../components/badge";
import { AnimateIcon, Icon } from "../components/icon";
import type { BadgeIntent } from "../contracts/badge";
import { BadgeCheck, Eye, Heart, ImageOff, MapPin, Scale, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "./motion";

type CardLinkProps = {
  href: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  children?: ReactNode;
};

function uniquePhotos(photos?: string[] | null, imageSrc?: string | null) {
  const list = [imageSrc, ...(photos ?? [])].filter(Boolean) as string[];
  return [...new Set(list)].slice(0, 6);
}

const ICON_BTN =
  "grid size-9 place-items-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition hover:scale-105 hover:bg-paper";

export function VendorCard({
  name,
  category,
  location,
  priceBand,
  rating = 0,
  ratingCount,
  imageSrc,
  photos,
  imageAlt,
  status,
  statusIntent = "success",
  verified,
  featured,
  sponsored,
  onShortlist,
  shortlisted,
  onCompare,
  compared,
  onQuickView,
  matchChips,
  href,
  linkAs: LinkComponent = "a",
  onNavigate,
}: {
  name: string;
  category: string;
  location: string;
  priceBand: string;
  rating?: number;
  ratingCount?: number;
  imageSrc?: string | null;
  photos?: string[] | null;
  imageAlt?: string;
  status?: string;
  statusIntent?: BadgeIntent;
  avatarSrc?: string | null;
  actionLabel?: string;
  verified?: boolean;
  featured?: boolean;
  /** Paid placement — always labelled Sponsored, never Ceylon Pick / Featured. */
  sponsored?: boolean;
  onShortlist?: () => void;
  shortlisted?: boolean;
  onCompare?: () => void;
  compared?: boolean;
  /** Opens a quick-view modal without leaving the list. */
  onQuickView?: () => void;
  /** Short “why this match” labels under category/location. */
  matchChips?: string[];
  href?: string;
  linkAs?: ElementType<CardLinkProps>;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const gallery = useMemo(
    () => uniquePhotos(photos, imageSrc).filter((src) => !broken.has(src)),
    [photos, imageSrc, broken],
  );
  const [active, setActive] = useState(0);
  const hero = gallery[Math.min(active, Math.max(gallery.length - 1, 0))];
  const LinkRoot = href ? LinkComponent : "div";

  function stop(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <AnimateIcon animateOnHover asChild>
      <motion.article
        whileHover={reduce ? undefined : { y: -4 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="h-full"
        onMouseLeave={() => setActive(0)}
      >
        <div className="group relative flex h-full flex-col gap-3">
          {href ? (
            <LinkRoot
              href={href}
              aria-label={name}
              className="absolute inset-0 z-[1] rounded-[1.75rem] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:outline-none"
              onClick={() => onNavigate?.()}
            >
              <span className="sr-only">{name}</span>
            </LinkRoot>
          ) : null}

          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-muted shadow-card transition-shadow duration-500 group-hover:shadow-raised">
            <AnimatePresence initial={false}>
              {hero ? (
                <motion.img
                  key={hero}
                  src={hero}
                  alt={imageAlt ?? name}
                  loading="lazy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  onError={() => setBroken((prev) => new Set(prev).add(hero))}
                  className="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/20 via-muted to-love/15">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span className="font-serif text-7xl text-primary/40">{name.slice(0, 1)}</span>
                    <ImageOff className="size-4 opacity-50" />
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Hover zones: move across the photo to scrub the gallery (desktop). */}
            {gallery.length > 1 ? (
              <div className="pointer-events-auto absolute inset-0 z-[2] hidden md:flex">
                {gallery.slice(0, 5).map((src, index) => (
                  <span key={src} className="h-full flex-1" onMouseEnter={() => setActive(index)} />
                ))}
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-ink/25" />

            {gallery.length > 1 ? (
              <div className="absolute inset-x-4 top-2.5 z-10 flex gap-1">
                {gallery.slice(0, 5).map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Photo ${index + 1}`}
                    className={cn(
                      "pointer-events-auto h-[3px] flex-1 rounded-full transition-all",
                      index === active ? "bg-paper" : "bg-paper/35",
                    )}
                    onClick={(event) => {
                      stop(event);
                      setActive(index);
                    }}
                  />
                ))}
              </div>
            ) : null}

            <div className="absolute top-5 left-4 z-10 flex flex-wrap gap-1.5">
              {sponsored ? (
                <span className="rounded-full bg-paper/90 px-2.5 py-1 text-label font-medium text-ink backdrop-blur">
                  Sponsored
                </span>
              ) : null}
              {!sponsored && featured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-label font-medium text-ink backdrop-blur">
                  <Star className="size-3 fill-primary text-primary" />
                  Featured
                </span>
              ) : null}
              {status ? <Badge intent={statusIntent}>{status}</Badge> : null}
            </div>

            <div className="pointer-events-auto absolute top-5 right-4 z-10 flex flex-col gap-1.5">
              {onShortlist ? (
                <motion.button
                  type="button"
                  aria-label={shortlisted ? "Remove from team" : "Save to team"}
                  aria-pressed={shortlisted}
                  className={cn(ICON_BTN, shortlisted && "text-love")}
                  whileTap={reduce ? undefined : { scale: 0.85 }}
                  onClick={(event) => {
                    stop(event);
                    onShortlist();
                  }}
                >
                  <Icon
                    icon={Heart}
                    size="sm"
                    className={cn(shortlisted && "fill-current text-love")}
                    animation={shortlisted ? "fill" : "default"}
                    animate={shortlisted || undefined}
                    animateOnHover
                  />
                </motion.button>
              ) : null}
              {onCompare ? (
                <motion.button
                  type="button"
                  aria-label={compared ? "Remove from compare" : "Add to compare"}
                  aria-pressed={compared}
                  className={cn(
                    ICON_BTN,
                    "md:translate-x-1 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100",
                    compared &&
                      "bg-primary text-primary-foreground opacity-100 hover:bg-primary md:translate-x-0 md:opacity-100",
                  )}
                  whileTap={reduce ? undefined : { scale: 0.85 }}
                  onClick={(event) => {
                    stop(event);
                    onCompare();
                  }}
                >
                  <Scale className="size-4" />
                </motion.button>
              ) : null}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid gap-1.5 p-5 text-paper">
              <div className="flex items-center gap-2 text-label font-medium tracking-eyebrow text-paper/80 uppercase">
                <span className="truncate">{category}</span>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-paper/15 px-2 py-0.5 tracking-normal normal-case backdrop-blur-md">
                  <Star className="size-3 fill-primary text-primary" />
                  {rating ? rating.toFixed(1) : "New"}
                  {ratingCount ? <span className="text-paper/70">({ratingCount})</span> : null}
                </span>
              </div>
              <h3 className="flex items-center gap-1.5 font-serif text-2xl leading-tight font-medium tracking-tight">
                <span className="truncate">{name}</span>
                {verified ? <BadgeCheck className="size-5 shrink-0 text-paper" aria-label="Verified" /> : null}
              </h3>
            </div>

            {onQuickView ? (
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  onQuickView();
                }}
                className="pointer-events-auto absolute top-1/2 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-paper/95 px-4 py-2 text-xs font-medium whitespace-nowrap text-ink shadow-md backdrop-blur transition-all duration-300 hover:bg-paper md:scale-90 md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100 md:focus-visible:scale-100 md:focus-visible:opacity-100"
              >
                <Eye className="size-3.5" /> Quick view
              </button>
            ) : null}
          </div>

          <div className="pointer-events-none grid gap-2 px-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{[...new Set(location.split(/,\s*/))].join(", ")}</span>
              </p>
              <p className="shrink-0 text-sm font-medium text-foreground">{priceBand}</p>
            </div>
            {matchChips?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {matchChips.map((chip) => (
                  <span
                    key={chip}
                    className="max-w-full truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-label font-medium text-primary"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </motion.article>
    </AnimateIcon>
  );
}
