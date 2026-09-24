"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Badge } from "../components/badge";
import { Card } from "../components/card";
import { AnimateIcon, Icon } from "../components/icon";
import type { BadgeIntent } from "../contracts/badge";
import { Heart, MapPin, Scale, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, useReducedMotion } from "./motion";

type CardLinkProps = {
  href: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  children?: ReactNode;
};

function uniquePhotos(photos?: string[] | null, imageSrc?: string | null) {
  const list = (photos?.length ? photos : imageSrc ? [imageSrc] : []).filter(Boolean) as string[];
  return [...new Set(list)].slice(0, 6);
}

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
  /** Short “why this match” labels under category/location. */
  matchChips?: string[];
  href?: string;
  linkAs?: ElementType<CardLinkProps>;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  const gallery = useMemo(() => uniquePhotos(photos, imageSrc), [photos, imageSrc]);
  const [active, setActive] = useState(0);
  const hero = gallery[Math.min(active, Math.max(gallery.length - 1, 0))];
  const LinkRoot = href ? LinkComponent : "div";

  return (
    <AnimateIcon animateOnHover asChild>
    <motion.article
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="h-full"
    >
      <Card
        elevation="interactive"
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-card/90"
      >
        {href ? (
          <LinkRoot
            href={href}
            aria-label={name}
            className="absolute inset-0 z-[1] rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onNavigate?.()}
          >
            <span className="sr-only">{name}</span>
          </LinkRoot>
        ) : null}

        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={imageAlt ?? name}
              className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-secondary to-muted">
              <span className="font-serif text-4xl text-muted-foreground/50">{name.slice(0, 1)}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/55 via-transparent to-background/10" />

          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
            {featured ? <Badge intent="love">Featured</Badge> : null}
            {verified ? <Badge intent="success">Verified</Badge> : null}
            {status ? <Badge intent={statusIntent}>{status}</Badge> : null}
          </div>

          <div className="absolute top-3 right-3 z-10 flex gap-1.5 pointer-events-auto">
            {onShortlist ? (
              <motion.button
                type="button"
                aria-label={shortlisted ? "Remove from team" : "Save to team"}
                aria-pressed={shortlisted}
                className={cn(
                  "grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background",
                  shortlisted && "text-primary",
                )}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onShortlist();
                }}
              >
                <Icon
                  icon={Heart}
                  size="sm"
                  className={cn(shortlisted && "text-primary")}
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
                  "grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background",
                  compared && "bg-primary text-primary-foreground hover:bg-primary",
                )}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onCompare();
                }}
              >
                <Scale className="size-4" />
              </motion.button>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 flex gap-1.5">
              {gallery.slice(0, 4).map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  aria-label={`Photo ${index + 1}`}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition",
                    index === active ? "bg-background" : "bg-background/40 hover:bg-background/70",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActive(index);
                  }}
                  onMouseEnter={() => setActive(index)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="pointer-events-none relative flex flex-1 flex-col gap-3 px-4 py-4">
          <div className="grid gap-1">
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {category}
            </p>
            <h3 className="truncate font-serif text-xl font-semibold tracking-tight">{name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Icon icon={Star} size="xs" className="text-primary" />
              <span className="font-medium text-foreground">{rating ? rating.toFixed(1) : "New"}</span>
              {ratingCount ? <span>({ratingCount})</span> : null}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon icon={MapPin} size="xs" />
              <span className="truncate">{location}</span>
            </span>
          </div>
          {matchChips?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {matchChips.map((chip) => (
                <Badge key={chip} intent="outline" className="max-w-full truncate px-2 py-0.5 text-[10px]">
                  {chip}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="mt-auto text-sm font-medium text-primary">{priceBand}</p>
        </div>
      </Card>
    </motion.article>
    </AnimateIcon>
  );
}
