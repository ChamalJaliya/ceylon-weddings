"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, useReducedMotion, Stagger, StaggerItem, AnimatePresence } from "./motion";

const SLIDE_MS = 7000;
const WIPE_EASE = [0.76, 0, 0.24, 1] as const;

const wipeVariants = {
  enter: (dir: number) => ({
    clipPath: dir >= 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
    scale: 1.08,
  }),
  center: {
    clipPath: "inset(0% 0% 0% 0%)",
    scale: 1.16,
    transition: {
      clipPath: { duration: 1.15, ease: WIPE_EASE },
      scale: { duration: SLIDE_MS / 1000, ease: "linear" as const },
    },
  },
  leave: (dir: number) => ({
    opacity: 0.85,
    scale: 1.12,
    clipPath: dir >= 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
    transition: { duration: 1.15, ease: WIPE_EASE },
  }),
};

function useHeroCarousel(images: string[], reduce: boolean | null) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const count = images.length;
  const current = images[index] ?? images[0]!;

  function go(dir: number) {
    if (count < 2) return;
    setDirection(dir);
    setIndex((i) => (i + dir + count) % count);
  }

  function goTo(next: number) {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    if (reduce || count < 2) return;
    const id = window.setTimeout(() => go(1), SLIDE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart timer on each slide
  }, [index, reduce, count]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return { index, direction, current, count, go, goTo };
}

function HeroImages({
  images,
  alt,
  reduce,
  index,
  direction,
  current,
}: {
  images: string[];
  alt: string;
  reduce: boolean | null;
  index: number;
  direction: number;
  current: string;
}) {
  if (images.length < 2) {
    return (
      <motion.img
        src={current}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        initial={reduce ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
    );
  }

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={`${index}-${current}`}
          src={current}
          alt={alt}
          custom={direction}
          variants={reduce ? undefined : wipeVariants}
          initial={reduce ? { opacity: 0 } : "enter"}
          animate={reduce ? { opacity: 1 } : "center"}
          exit={reduce ? { opacity: 0 } : "leave"}
          className="absolute inset-0 size-full object-cover will-change-transform"
        />
      </AnimatePresence>
    </div>
  );
}

function HeroControls({
  images,
  index,
  go,
  goTo,
}: {
  images: string[];
  index: number;
  go: (dir: number) => void;
  goTo: (next: number) => void;
}) {
  const count = images.length;
  if (count < 2) return null;

  return (
    <>
      <div className="pointer-events-none absolute top-1/2 right-5 z-20 hidden -translate-y-1/2 flex-col items-center gap-4 lg:right-10 lg:flex">
        <div className="pointer-events-auto flex flex-col gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photograph ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className="relative h-10 w-[2px] overflow-hidden rounded-full bg-hero-foreground/25"
            >
              {i === index ? (
                <span className="cw-hero-progress absolute inset-x-0 top-0 bg-hero-foreground" />
              ) : i < index ? (
                <span className="absolute inset-0 bg-hero-foreground/70" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            aria-label="Previous photograph"
            onClick={() => go(-1)}
            className="grid size-9 place-items-center rounded-full border border-hero-foreground/25 bg-hero-foreground/10 text-hero-foreground backdrop-blur-md transition hover:bg-hero-foreground/20"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next photograph"
            onClick={() => go(1)}
            className="grid size-9 place-items-center rounded-full border border-hero-foreground/25 bg-hero-foreground/10 text-hero-foreground backdrop-blur-md transition hover:bg-hero-foreground/20"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <p className="font-serif text-[11px] tracking-[0.2em] text-hero-foreground/80">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-1 opacity-50">/</span>
          {String(count).padStart(2, "0")}
        </p>
      </div>

      <div className="absolute inset-x-8 bottom-32 z-20 flex gap-1.5 sm:inset-x-12 lg:hidden">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Show photograph ${i + 1}`}
            onClick={() => goTo(i)}
            className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-hero-foreground/25"
          >
            {i === index ? (
              <span className="cw-hero-progress-x absolute inset-y-0 left-0 bg-hero-foreground" />
            ) : i < index ? (
              <span className="absolute inset-0 bg-hero-foreground/70" />
            ) : null}
          </button>
        ))}
      </div>
    </>
  );
}

export function CoupleHero({
  imageSrc,
  images,
  imageAlt,
  kicker,
  names,
  date,
  place,
  days,
  daysLabel,
  chips,
  portraits,
  actions,
  footer,
  children,
  density = "editorial",
}: {
  imageSrc: string;
  images?: string[];
  imageAlt: string;
  kicker?: string;
  names: string;
  date?: string;
  place?: string;
  days?: string;
  daysLabel?: string;
  chips?: string[];
  portraits?: { src: string; alt: string }[];
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  density?: "editorial" | "hub";
}) {
  const hub = density === "hub";
  const reduce = useReducedMotion();
  const slides = (images?.length ? images : [imageSrc]).filter(Boolean);
  const stageImages = hub ? [imageSrc] : slides;
  const carousel = useHeroCarousel(stageImages, reduce);

  return (
    <section
      data-slot="couple-hero"
      data-density={density}
      className={cn(
        "relative isolate overflow-hidden",
        hub ? "rounded-3xl" : "min-h-[calc(100dvh-var(--cw-frame-bottom,0px))]",
      )}
    >
      <HeroImages
        images={stageImages}
        alt={imageAlt}
        reduce={reduce}
        index={carousel.index}
        direction={carousel.direction}
        current={carousel.current}
      />
      {hub ? (
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/40" />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35" />
        </>
      )}
      <div
        className={
          hub
            ? "relative flex min-h-72 flex-col justify-end px-6 py-10 sm:min-h-80 sm:px-8"
            : "relative flex min-h-[calc(100dvh-var(--cw-frame-bottom,0px))] flex-col"
        }
      >
        <div
          className={
            hub
              ? "flex flex-wrap items-end justify-between gap-8"
              : "flex flex-1 flex-col justify-center px-8 pt-28 pb-10 sm:px-12 lg:px-16 lg:pr-28"
          }
        >
          <div className={cn("flex flex-wrap items-end justify-between gap-8", !hub && "w-full")}>
            <Stagger className={hub ? "max-w-2xl" : "max-w-3xl"} stagger={0.08}>
              {kicker ? (
                <StaggerItem>
                  <p className="text-[11px] tracking-[0.28em] text-hero-muted uppercase">{kicker}</p>
                </StaggerItem>
              ) : null}
              <StaggerItem>
                <h1
                  className={cn(
                    "mt-2 font-serif leading-[0.95] font-semibold text-hero-foreground",
                    hub ? "text-4xl sm:text-5xl lg:text-6xl" : "text-5xl sm:text-6xl lg:text-7xl",
                  )}
                >
                  {names}
                </h1>
              </StaggerItem>
              <StaggerItem>
                <div className="mt-5 h-px w-16 bg-primary" />
              </StaggerItem>
              {date || place ? (
                <StaggerItem>
                  <p className={cn("mt-4 text-hero-muted", hub ? "text-sm" : "max-w-lg text-[15px] leading-relaxed")}>
                    {date}
                    {date && place ? <span className="mx-2 text-primary">·</span> : null}
                    {place}
                  </p>
                </StaggerItem>
              ) : null}
              {chips?.length ? (
                <StaggerItem>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <li
                        key={chip}
                        className="rounded-full border border-hero-foreground/20 px-3 py-1 text-[11px] tracking-wide text-hero-foreground"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                </StaggerItem>
              ) : null}
              {actions ? (
                <StaggerItem>
                  <div className="mt-7 flex flex-wrap gap-3">{actions}</div>
                </StaggerItem>
              ) : null}
            </Stagger>
            <div className="flex items-end gap-8">
              {days ? (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p
                    className="font-serif text-6xl leading-none text-hero-foreground"
                    aria-live="polite"
                    aria-label={`${days} ${daysLabel ?? ""}`}
                  >
                    <span className="inline-flex tabular-nums" aria-hidden>
                      {days.split("").map((char, i) => (
                        <span key={i} className="relative inline-block overflow-hidden" style={{ height: "1em" }}>
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={`${i}-${char}`}
                              className="inline-block"
                              initial={reduce ? false : { y: "-60%", opacity: 0 }}
                              animate={{ y: "0%", opacity: 1 }}
                              exit={reduce ? undefined : { y: "60%", opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            >
                              {char}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      ))}
                    </span>
                  </p>
                  {daysLabel ? (
                    <p className="mt-1 text-[10px] tracking-[0.28em] text-hero-muted uppercase">{daysLabel}</p>
                  ) : null}
                </motion.div>
              ) : null}
              {portraits?.length ? (
                <div className="flex">
                  {portraits.map((portrait, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={portrait.src}
                      src={portrait.src}
                      alt={portrait.alt}
                      className="size-14 rounded-full border-2 border-hero-foreground/40 object-cover"
                      style={{ marginLeft: index === 0 ? 0 : -12 }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {footer ? (
          <div className={hub ? "relative mt-8" : "relative z-10 px-8 pb-10 sm:px-12 sm:pb-8 lg:px-16"}>{footer}</div>
        ) : null}
      </div>
      {hub ? null : (
        <HeroControls images={stageImages} index={carousel.index} go={carousel.go} goTo={carousel.goTo} />
      )}
      {children ? (
        <div className={hub ? "relative px-6 pb-6 sm:px-8" : "relative z-10 -mt-10 px-8"}>{children}</div>
      ) : null}
    </section>
  );
}
