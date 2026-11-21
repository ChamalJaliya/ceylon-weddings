"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Badge } from "../components/badge";
import { AnimateIcon, Icon } from "../components/icon";
import type { BadgeIntent } from "../contracts/badge";
import { ArrowUpRight, BadgeCheck, Eye, Heart, ImageOff, MapPin, Scale, Star } from "lucide-react";
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
        whileHover={reduce ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="h-full"
        onMouseLeave={() => setActive(0)}
      >
        <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-shadow duration-500 hover:shadow-raised">
          {href ? (
            <LinkRoot
              href={href}
              aria-label={name}
              className="absolute inset-0 z-[1] rounded-3xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onNavigate?.()}
            >
              <span className="sr-only">{name}</span>
            </LinkRoot>
          ) : null}

          <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
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
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/15 via-muted to-love/10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <span className="font-serif text-5xl text-primary/40">{name.slice(0, 1)}</span>
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

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/15" />

            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
              {featured ? <Badge intent="love">Featured</Badge> : null}
              {status ? <Badge intent={statusIntent}>{status}</Badge> : null}
            </div>

            <div className="pointer-events-auto absolute top-3 right-3 z-10 flex gap-1.5">
              {onShortlist ? (
                <motion.button
                  type="button"
                  aria-label={shortlisted ? "Remove from team" : "Save to team"}
                  aria-pressed={shortlisted}
                  className={cn(ICON_BTN, shortlisted && "text-primary")}
                  whileTap={reduce ? undefined : { scale: 0.85 }}
                  onClick={(event) => {
                    stop(event);
                    onShortlist();
                  }}
                >
                  <Icon
                    icon={Heart}
                    size="sm"
                    className={cn(shortlisted && "fill-current text-primary")}
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
                  className={cn(ICON_BTN, compared && "bg-primary text-primary-foreground hover:bg-primary")}
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

            {onQuickView ? (
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  onQuickView();
                }}
                className="pointer-events-auto absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper/95 px-4 py-2 text-xs font-medium whitespace-nowrap text-ink shadow-md backdrop-blur transition-all duration-300 hover:bg-paper md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
              >
                <Eye className="size-3.5" /> Quick view
              </button>
            ) : null}

            {gallery.length > 1 ? (
              <div className="absolute inset-x-4 bottom-1.5 z-10 flex gap-1">
                {gallery.slice(0, 5).map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Photo ${index + 1}`}
                    className={cn(
                      "pointer-events-auto h-1 flex-1 rounded-full transition-all",
                      index === active ? "bg-paper" : "bg-paper/40",
                    )}
                    onClick={(event) => {
                      stop(event);
                      setActive(index);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none relative flex flex-1 flex-col gap-2.5 px-5 pt-4 pb-5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-label font-medium tracking-eyebrow text-primary uppercase">{category}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                <Star className="size-3 fill-primary text-primary" />
                <span className="font-medium">{rating ? rating.toFixed(1) : "New"}</span>
                {ratingCount ? <span className="text-muted-foreground">({ratingCount})</span> : null}
              </span>
            </div>
            <h3 className="flex items-center gap-1.5 font-serif text-xl font-medium tracking-tight">
              <span className="truncate">{name}</span>
              {verified ? <BadgeCheck className="size-4.5 shrink-0 text-primary" aria-label="Verified" /> : null}
            </h3>
            <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
            {matchChips?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {matchChips.map((chip) => (
                  <Badge key={chip} intent="outline" className="max-w-full truncate px-2 py-0.5 text-label">
                    {chip}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="truncate text-sm font-medium text-foreground">{priceBand}</p>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-45 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </AnimateIcon>
  );
}
