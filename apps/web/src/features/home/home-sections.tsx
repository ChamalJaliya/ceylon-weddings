"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  MapPin,
  Sparkles,
  Wallet,
  Users,
  CalendarHeart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import {
  AnimatePresence,
  Reveal,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import { CATEGORY_PHOTOS } from "@/lib/category-media";

const img = (index: number, width = 1200) =>
  (WEDDING_IMAGES[index % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0]).replace("w=2000", `w=${width}`);

/* ─── Section heading ─────────────────────────────────────────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-wrap items-end gap-4",
        align === "center" ? "flex-col items-center text-center" : "justify-between",
      )}
    >
      <div className={align === "center" ? "max-w-2xl" : undefined}>
        <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
          <span className="h-px w-8 bg-primary/50" />
          {eyebrow}
        </p>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-balance sm:text-5xl">{title}</h2>
        {sub ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-h4">{sub}</p> : null}
      </div>
      {action}
    </Reveal>
  );
}

/* ─── Places marquee ───────────────────────────────────────────────────── */

const PLACES: { name: string; district: string; vibe: string; image: number }[] = [
  { name: "Colombo", district: "Colombo", vibe: "Grand ballrooms", image: 3 },
  { name: "Kandy", district: "Kandy", vibe: "Hill-country tradition", image: 0 },
  { name: "Galle", district: "Galle", vibe: "Fort & ocean views", image: 6 },
  { name: "Bentota", district: "Galle", vibe: "Beach vows", image: 5 },
  { name: "Negombo", district: "Gampaha", vibe: "Lagoon receptions", image: 1 },
  { name: "Nuwara Eliya", district: "Nuwara Eliya", vibe: "Misty estates", image: 2 },
  { name: "Jaffna", district: "Jaffna", vibe: "Tamil heritage", image: 4 },
  { name: "Sigiriya", district: "Matale", vibe: "Jungle luxe", image: 3 },
  { name: "Mount Lavinia", district: "Colombo", vibe: "Sunset seaside", image: 6 },
  { name: "Kurunegala", district: "Kurunegala", vibe: "Big family weddings", image: 0 },
];

export function PlacesMarquee() {
  const rows = [PLACES.slice(0, 5), PLACES.slice(5)];
  return (
    <section className="cw-marquee-host relative overflow-hidden border-y border-border bg-card/60 py-8">
      <p className="mb-5 flex items-center justify-center gap-2 text-label font-medium tracking-eyebrow text-muted-foreground uppercase">
        <MapPin className="size-3.5 text-primary" /> Weddings across the island
      </p>
      <div className="grid gap-4 [mask-image:linear-gradient(to_right,transparent,var(--color-ink)_10%,var(--color-ink)_90%,transparent)]">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={cn("flex w-max gap-4", rowIndex === 0 ? "cw-marquee" : "cw-marquee-reverse")}>
            {[...row, ...row, ...row].map((place, index) => {
              const hidden = index >= row.length;
              return (
                <Link
                  key={`${place.name}-${index}`}
                  href={`/vendors?district=${encodeURIComponent(place.district)}`}
                  aria-hidden={hidden}
                  tabIndex={hidden ? -1 : undefined}
                  className="group flex items-center gap-3 rounded-full border border-border bg-background py-1.5 pr-5 pl-1.5 whitespace-nowrap shadow-card transition-all hover:border-primary/50 hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img(place.image, 200)}
                    alt=""
                    loading="lazy"
                    className="size-11 rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className="flex flex-col leading-tight">
                    <span className="font-serif text-base group-hover:text-primary">{place.name}</span>
                    <span className="text-xs text-muted-foreground">{place.vibe}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Spotlight category grid (cursor-follow glow) ───────────────────────── */

const CATEGORY_GROUPS: { id: string; label: string; blurb: string; keys: string[] }[] = [
  { id: "all", label: "All", blurb: "Everything for the big day", keys: [] },
  {
    id: "ceremony",
    label: "Ceremony",
    blurb: "Poruwa, nekath and vows",
    keys: ["PORUWA", "ASTROLOGY", "REGISTRAR", "PLANNER", "MEHNDI"],
  },
  {
    id: "look",
    label: "The look",
    blurb: "Dressing the bride and groom",
    keys: ["BRIDAL_WEAR", "GROOM_WEAR", "BRIDAL_DRESSER", "HAIR_MAKEUP", "JEWELLERY"],
  },
  {
    id: "celebrate",
    label: "Celebration",
    blurb: "Venues, feasts and music",
    keys: ["VENUE", "CATERER", "CAKE", "ENTERTAINMENT", "FLORIST_DECOR", "INVITATIONS"],
  },
  {
    id: "memories",
    label: "Memories & travel",
    blurb: "Capture it, get there, stay over",
    keys: ["PHOTO_VIDEO", "WEDDING_CARS", "TRANSPORT", "ACCOMMODATION"],
  },
];

export function CategoryShowcase({
  categories,
  icons,
}: {
  categories: { key: string; label: string }[];
  icons: Record<string, LucideIcon>;
}) {
  const reduce = useReducedMotion();
  const available = new Set(categories.map((c) => c.key));
  const groups = CATEGORY_GROUPS.filter((g) => g.id === "all" || g.keys.some((k) => available.has(k)));
  const [active, setActive] = useState("all");
  const group = groups.find((g) => g.id === active) ?? groups[0];
  const shown = !group || group.id === "all" ? categories : categories.filter((c) => group.keys.includes(c.key));
  const [hovered, setHovered] = useState<string | null>(null);
  const previewIndex = Math.max(
    0,
    shown.findIndex((c) => c.key === hovered),
  );
  const preview = shown[previewIndex];
  const photoFor = (key: string, index: number, width: number) =>
    (CATEGORY_PHOTOS[key] ?? img(index, width)).replace(/w=\d+/, `w=${width}`);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex flex-wrap gap-1 rounded-full border border-border bg-card p-1 shadow-card">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setActive(g.id);
                setHovered(null);
              }}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm transition-colors",
                active === g.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active === g.id ? (
                <motion.span
                  layoutId="cw-category-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-md"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <span className="relative">{g.label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={group?.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            className="font-serif text-lg text-muted-foreground italic"
          >
            {group?.blurb}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="grid gap-6 md:grid-cols-5 md:gap-10">
        <ul className="md:col-span-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map(({ key, label }, index) => {
              const CategoryIcon = icons[key] ?? Sparkles;
              const isHover = (hovered ?? shown[0]?.key) === key;
              return (
                <motion.li
                  key={key}
                  layout
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: 16 }}
                  transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-border first:border-t"
                >
                  <Link
                    href={`/vendors?category=${key}`}
                    onMouseEnter={() => setHovered(key)}
                    onFocus={() => setHovered(key)}
                    className="group flex items-center gap-4 py-3.5 sm:py-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoFor(key, index, 200)}
                      alt=""
                      loading="lazy"
                      className="size-12 shrink-0 rounded-xl object-cover md:hidden"
                    />
                    <span className="hidden w-8 shrink-0 text-label text-muted-foreground tabular-nums md:block">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "hidden size-9 shrink-0 place-items-center rounded-xl transition-all duration-300 md:grid",
                        isHover ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon icon={CategoryIcon} size="sm" lottie={false} />
                    </span>
                    <span
                      className={cn(
                        "flex-1 font-serif text-xl transition-all duration-300 sm:text-3xl",
                        isHover ? "translate-x-2 text-primary" : "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                    <ArrowUpRight
                      className={cn(
                        "size-5 shrink-0 transition-all duration-300",
                        isHover ? "rotate-45 text-primary opacity-100" : "text-muted-foreground opacity-40",
                      )}
                    />
                  </Link>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <div className="relative hidden md:col-span-2 md:block">
          <div className="sticky top-24 aspect-[3/4] overflow-hidden rounded-3xl bg-muted shadow-raised">
            <AnimatePresence initial={false}>
              {preview ? (
                <motion.img
                  key={preview.key}
                  src={photoFor(preview.key, previewIndex, 1000)}
                  alt={preview.label}
                  initial={reduce ? false : { opacity: 0, scale: 1.12 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : null}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
            <AnimatePresence mode="wait">
              <motion.div
                key={preview?.key}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-x-0 bottom-0 p-6 text-paper"
              >
                <p className="text-label tracking-eyebrow text-paper/70 uppercase">{group?.label}</p>
                <p className="mt-1 font-serif text-3xl">{preview?.label}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-paper/85">
                  Explore vendors <ArrowRight className="size-4" />
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Moments bento gallery with parallax ────────────────────────────────── */

const MOMENTS = [
  { caption: "Poruwa ceremonies", span: "md:col-span-2 md:row-span-2" },
  { caption: "Kandyan bridal", span: "" },
  { caption: "Golden-hour portraits", span: "" },
  { caption: "Beach vows", span: "md:col-span-2" },
  { caption: "Family & tradition", span: "" },
  { caption: "Receptions", span: "" },
  { caption: "Homecomings", span: "md:col-span-2" },
];

function ParallaxTile({
  src,
  caption,
  className,
  index,
}: {
  src: string;
  caption: string;
  className?: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn("group relative min-h-48 overflow-hidden rounded-3xl bg-muted", className)}
    >
      <motion.img
        src={src}
        alt={caption}
        loading="lazy"
        style={{ y }}
        className="absolute inset-0 h-[116%] w-full -translate-y-[8%] object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
      <p className="absolute bottom-4 left-5 translate-y-1 font-serif text-lg text-paper transition-transform duration-500 group-hover:translate-y-0 sm:text-xl">
        {caption}
      </p>
    </motion.div>
  );
}

export function MomentsGallery() {
  return (
    <section>
      <SectionHeading
        eyebrow="Real moments"
        title={
          <>
            Every tradition, <em className="text-primary not-italic">beautifully</em> captured
          </>
        }
        action={
          <Button asChild variant="ghost" shape="pill">
            <Link href="/vendors?category=PHOTO_VIDEO" className="inline-flex items-center gap-1.5">
              Find photographers <Icon icon={ArrowRight} size="xs" lottie={false} />
            </Link>
          </Button>
        }
      />
      <div className="grid auto-rows-[12rem] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {MOMENTS.map((moment, index) => (
          <ParallaxTile
            key={moment.caption}
            index={index}
            src={img(index)}
            caption={moment.caption}
            className={moment.span}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── How it works: scroll-drawn timeline ────────────────────────────────── */

export function HowItWorksTimeline({
  steps,
  icons,
  sub,
  eyebrow = "How it works",
  title = "Plan your wedding in three steps",
}: {
  steps: { title: string; body: string }[];
  icons: LucideIcon[];
  sub: string;
  eyebrow?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section>
      <SectionHeading align="center" eyebrow={eyebrow} title={title} sub={sub} />
      <div ref={ref} className="relative">
        <div className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-border md:block">
          <motion.div
            style={{ scaleX }}
            className="h-full origin-left bg-gradient-to-r from-primary via-love to-primary"
          />
        </div>
        <Stagger className="grid gap-6 md:grid-cols-3" stagger={0.15}>
          {steps.map((step, index) => {
            const StepIcon = icons[index % icons.length] ?? Heart;
            return (
              <StaggerItem key={step.title} className="flex flex-col items-center text-center">
                <motion.span
                  whileHover={{ scale: 1.12, rotate: -6 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="relative z-10 mb-6 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-8 ring-background"
                >
                  <Icon icon={StepIcon} size="md" lottie={false} />
                  <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-background text-label font-medium text-primary ring-1 ring-primary/30">
                    {index + 1}
                  </span>
                </motion.span>
                <h3 className="mb-2 font-serif text-xl font-medium">{step.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ─── Planning tools showcase: floating live widgets ─────────────────────── */

const CHECKLIST = ["Book the Poruwa", "Confirm nekath times", "Choose the bridal dresser", "Send invitations"];

function FloatCard({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "absolute rounded-2xl border border-border bg-card/95 p-4 shadow-raised backdrop-blur-md",
        className,
      )}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 5 + delay * 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ToolsShowcase({ ctaLabel }: { ctaLabel: string }) {
  const reduce = useReducedMotion();
  const features: { icon: LucideIcon; label: string }[] = [
    { icon: CalendarHeart, label: "Poruwa, church & homecoming checklists" },
    { icon: Wallet, label: "Budget tracker in LKR" },
    { icon: Users, label: "Guest list, RSVPs & seating" },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary/5 ring-1 ring-primary/15">
      <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-14">
        <Reveal>
          <p className="mb-2 text-label font-medium tracking-eyebrow text-primary uppercase">Free planning tools</p>
          <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-balance sm:text-5xl">
            Checklist, budget & guests, made for Sri Lankan weddings
          </h2>
          <ul className="mb-8 grid gap-3">
            {features.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span className="grid size-9 place-items-center rounded-xl bg-background text-primary shadow-card">
                  <Icon icon={icon} size="sm" lottie={false} />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <Button asChild shape="pill" size="lg" className="group">
            <Link href="/register" className="inline-flex items-center gap-2">
              {ctaLabel}
              <Icon
                icon={ArrowRight}
                size="xs"
                lottie={false}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Button>
        </Reveal>

        <div className="relative h-96 md:h-[28rem]">
          <motion.img
            src={img(4, 1200)}
            alt="Couple planning their wedding"
            initial={reduce ? false : { opacity: 0, scale: 1.08 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 h-full w-4/5 rounded-3xl object-cover shadow-raised"
          />

          <FloatCard className="top-6 left-0 w-60" delay={0.2}>
            <p className="mb-3 text-label tracking-eyebrow text-muted-foreground uppercase">Checklist</p>
            <ul className="grid gap-2">
              {CHECKLIST.map((item, index) => (
                <motion.li
                  key={item}
                  initial={reduce ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.18 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <motion.span
                    initial={reduce ? false : { scale: 0 }}
                    whileInView={{ scale: index < 3 ? 1 : 0.0001 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + index * 0.25, type: "spring", stiffness: 400, damping: 15 }}
                    className="grid size-4 place-items-center rounded-full bg-success text-success-foreground"
                  >
                    <Check className="size-3" />
                  </motion.span>
                  <span className={index < 3 ? "text-muted-foreground line-through" : undefined}>{item}</span>
                </motion.li>
              ))}
            </ul>
          </FloatCard>

          <FloatCard className="bottom-6 left-8 w-56" delay={0.45}>
            <p className="mb-1 text-label tracking-eyebrow text-muted-foreground uppercase">Budget used</p>
            <p className="font-serif text-2xl">LKR 2.4M</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: reduce ? "62%" : "0%" }}
                whileInView={{ width: "62%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-love"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">62% of LKR 3.9M</p>
          </FloatCard>

          <FloatCard className="top-1/2 right-2 w-40" delay={0.7}>
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-love" />
              <p className="text-xs">RSVPs</p>
            </div>
            <p className="mt-1 font-serif text-2xl">186 / 240</p>
          </FloatCard>
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA with drifting petals ─────────────────────────────────────── */

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 73) % 100}%`,
  delay: `${(i * 1.3) % 9}s`,
  duration: `${10 + ((i * 7) % 8)}s`,
  size: 8 + ((i * 5) % 10),
}));

export function FinalCta({
  primary,
  secondary,
  title = "Your auspicious day starts here",
  sub = "Verified vendors, planning tools and a wedding website, all in one place and free for couples.",
  image = 6,
}: {
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  title?: string;
  sub?: string;
  image?: number;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(image, 2000)} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="cw-gradient-pan absolute inset-0 -z-10 bg-gradient-to-br from-ink/60 via-primary/25 to-ink/55" />
      {PETALS.map((petal, index) => (
        <span
          key={index}
          aria-hidden
          className="cw-petal pointer-events-none absolute -top-6 rounded-full rounded-tl-none bg-love/60 opacity-0"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center text-paper sm:py-28">
        <Sparkles className="mb-4 size-8 text-paper/80" />
        <h2 className="font-serif text-4xl font-medium tracking-tight text-balance sm:text-6xl">{title}</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/80 sm:text-h4">{sub}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild shape="pill" size="lg">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          <Button
            asChild
            shape="pill"
            size="lg"
            variant="outline"
            className="border-paper/40 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
          >
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── Hero stats: single glass bar with count-up numbers ─────────────────── */

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const match = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  const [display, setDisplay] = useState(match && !reduce ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    if (!match || !inView || reduce) return;
    const [, prefix, num, suffix] = match;
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.includes(".") ? (num.split(".")[1]?.length ?? 0) : 0;
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = (target * eased).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      setDisplay(`${prefix}${current}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return <span ref={ref}>{display}</span>;
}

export function HeroStats({ stats, icons }: { stats: { value: string; label: string }[]; icons: LucideIcon[] }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-hero-foreground/15 bg-hero-foreground/5 backdrop-blur-xl"
    >
      <div className="grid grid-cols-2 divide-hero-foreground/10 md:grid-cols-4 md:divide-x">
        {stats.map(({ value, label }, index) => {
          const StatIcon = icons[index % icons.length] ?? Sparkles;
          return (
            <motion.div
              key={label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              className="group relative flex items-center gap-4 px-5 py-5 transition-colors duration-300 hover:bg-hero-foreground/5 sm:px-6"
            >
              <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-hero-foreground/10 text-hero-foreground ring-1 ring-hero-foreground/15 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
                <Icon icon={StatIcon} size="sm" lottie={false} />
                <span className="absolute inset-0 rounded-full ring-1 ring-primary/0 transition-all duration-500 group-hover:scale-125 group-hover:ring-primary/40" />
              </span>
              <div className="min-w-0">
                <p className="font-serif text-2xl leading-none text-hero-foreground tabular-nums sm:text-3xl">
                  <CountUp value={value} />
                </p>
                <p className="mt-1.5 text-label tracking-eyebrow text-hero-muted uppercase">{label}</p>
              </div>
              <span className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary to-love transition-transform duration-500 group-hover:scale-x-100" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
