"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Scale,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "./motion";

export type VendorQuickViewData = {
  name: string;
  category: string;
  location: string;
  priceBand: string;
  rating?: number;
  ratingCount?: number;
  photos: string[];
  description?: string | null;
  highlights?: string[];
  verified?: boolean;
  featured?: boolean;
  yearsExperience?: number;
  couplesServed?: number;
  whatsapp?: string | null;
  href: string;
};

type LinkProps = { href: string; className?: string; children?: ReactNode; onClick?: () => void };

export function VendorQuickView({
  open,
  onOpenChange,
  vendor,
  linkAs: LinkComponent = "a",
  onShortlist,
  shortlisted,
  onCompare,
  compared,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: VendorQuickViewData | null;
  linkAs?: ElementType<LinkProps>;
  onShortlist?: () => void;
  shortlisted?: boolean;
  onCompare?: () => void;
  compared?: boolean;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const photos = vendor?.photos.length ? vendor.photos : [];
  const count = photos.length;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, vendor?.href]);

  function go(step: number) {
    if (count < 2) return;
    setDirection(step);
    setIndex((current) => (current + step + count) % count);
  }

  const stats = [
    vendor?.rating ? { value: vendor.rating.toFixed(1), label: `${vendor.ratingCount ?? 0} reviews` } : null,
    vendor?.yearsExperience ? { value: `${vendor.yearsExperience}+`, label: "Years" } : null,
    vendor?.couplesServed ? { value: `${vendor.couplesServed}+`, label: "Couples" } : null,
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && vendor ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="modal__overlay backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className={cn(
                  "fixed z-[var(--z-modal)] flex flex-col overflow-hidden bg-card shadow-raised outline-none",
                  "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
                  "md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[88dvh] md:h-[min(40rem,88dvh)] md:w-[min(60rem,calc(100vw-3rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:flex-row md:rounded-3xl",
                )}
              >
                <span className="absolute top-2 left-1/2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-paper/70 md:hidden" />

                {/* Gallery */}
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted md:m-3 md:aspect-auto md:w-[42%] md:rounded-2xl">
                  <AnimatePresence initial={false} custom={direction}>
                    {count ? (
                      <motion.img
                        key={photos[index]}
                        src={photos[index]}
                        alt={`${vendor.name} photo ${index + 1}`}
                        custom={direction}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        drag={count > 1 && !reduce ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -60) go(1);
                          else if (info.offset.x > 60) go(-1);
                        }}
                        className="absolute inset-0 size-full cursor-grab object-cover active:cursor-grabbing"
                      />
                    ) : (
                      <div className="grid size-full place-items-center">
                        <span className="font-serif text-6xl text-muted-foreground/40">{vendor.name.slice(0, 1)}</span>
                      </div>
                    )}
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/20" />

                  <div className="absolute top-4 left-4 flex gap-1.5">
                    {vendor.featured ? <Badge intent="love">Featured</Badge> : null}
                    {vendor.verified ? <Badge intent="success">Verified</Badge> : null}
                  </div>

                  {count > 1 ? (
                    <>
                      <button
                        type="button"
                        aria-label="Previous photo"
                        onClick={() => go(-1)}
                        className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/85 text-ink shadow-md backdrop-blur transition hover:scale-105 hover:bg-paper"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next photo"
                        onClick={() => go(1)}
                        className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/85 text-ink shadow-md backdrop-blur transition hover:scale-105 hover:bg-paper"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 px-4">
                        {photos.map((src, i) => (
                          <button
                            key={`${src}-${i}`}
                            type="button"
                            aria-label={`Photo ${i + 1}`}
                            onClick={() => {
                              setDirection(i > index ? 1 : -1);
                              setIndex(i);
                            }}
                            className={cn(
                              "hidden size-10 overflow-hidden rounded-lg ring-2 transition md:block",
                              i === index ? "ring-paper" : "opacity-70 ring-transparent hover:opacity-100",
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="size-full object-cover" />
                          </button>
                        ))}
                        <span className="rounded-full bg-ink/60 px-2.5 py-1 text-xs text-paper backdrop-blur md:hidden">
                          {index + 1} / {count}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Details */}
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <p className="text-label font-medium tracking-eyebrow text-primary uppercase">{vendor.category}</p>
                    <DialogPrimitive.Title className="mt-1 flex items-center gap-2 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                      {vendor.name}
                      {vendor.verified ? <BadgeCheck className="size-6 shrink-0 text-primary" /> : null}
                    </DialogPrimitive.Title>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4" /> {vendor.location}
                    </p>

                    {stats.length ? (
                      <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-background">
                        {stats.map((stat, i) => (
                          <motion.div
                            key={stat.label}
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.07 }}
                            className="px-3 py-3 text-center"
                          >
                            <p className="flex items-center justify-center gap-1 font-serif text-xl">
                              {i === 0 && vendor.rating ? <Star className="size-4 fill-primary text-primary" /> : null}
                              {stat.value}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : null}

                    {vendor.description ? (
                      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{vendor.description}</p>
                    ) : null}

                    {vendor.highlights?.length ? (
                      <div className="mt-6">
                        <p className="mb-2 flex items-center gap-1.5 text-label tracking-eyebrow text-muted-foreground uppercase">
                          <Sparkles className="size-3.5 text-primary" /> Highlights
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {vendor.highlights.slice(0, 8).map((item, i) => (
                            <motion.span
                              key={item}
                              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + i * 0.04 }}
                              className="rounded-full border border-border bg-background px-3 py-1 text-xs"
                            >
                              {item}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-border bg-card/95 p-4 backdrop-blur sm:px-8 sm:py-5">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting at</p>
                        <p className="font-serif text-2xl text-primary">{vendor.priceBand}</p>
                      </div>
                      <div className="flex gap-2">
                        {onShortlist ? (
                          <button
                            type="button"
                            aria-pressed={shortlisted}
                            aria-label={shortlisted ? "Remove from team" : "Save to team"}
                            onClick={onShortlist}
                            className={cn(
                              "grid size-11 place-items-center rounded-full border border-border transition hover:border-primary/50",
                              shortlisted && "border-primary bg-primary/10 text-primary",
                            )}
                          >
                            <Heart className={cn("size-5", shortlisted && "fill-current")} />
                          </button>
                        ) : null}
                        {onCompare ? (
                          <button
                            type="button"
                            aria-pressed={compared}
                            aria-label={compared ? "Remove from compare" : "Add to compare"}
                            onClick={onCompare}
                            className={cn(
                              "grid size-11 place-items-center rounded-full border border-border transition hover:border-primary/50",
                              compared && "border-primary bg-primary text-primary-foreground",
                            )}
                          >
                            <Scale className="size-5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {vendor.whatsapp ? (
                        <Button asChild variant="outline" shape="pill" size="lg">
                          <a
                            href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="size-4" /> WhatsApp
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        shape="pill"
                        size="lg"
                        className={cn("group", !vendor.whatsapp && "sm:col-span-2")}
                      >
                        <LinkComponent
                          href={vendor.href}
                          onClick={() => {
                            onNavigate?.();
                            onOpenChange(false);
                          }}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          View full profile
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </LinkComponent>
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogPrimitive.Close
                  aria-label="Close"
                  className="absolute top-4 right-4 z-20 grid size-10 place-items-center rounded-full bg-paper/90 text-ink shadow-md backdrop-blur transition hover:rotate-90 hover:bg-paper md:bg-background md:text-foreground"
                >
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
