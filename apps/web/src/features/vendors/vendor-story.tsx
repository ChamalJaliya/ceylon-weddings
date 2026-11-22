"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MessageCircle,
  Plane,
  Quote,
  Star,
  Users,
} from "lucide-react";
import type { Vendor } from "@ceylonweddings/contracts";
import { api } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { CelebrationBurst } from "@ceylonweddings/ui/domain/celebration-burst";
import { VendorCard } from "@ceylonweddings/ui/domain/vendor-card";
import { VendorQuickView } from "@ceylonweddings/ui/domain/vendor-quick-view";
import {
  AnimatePresence,
  LayoutGroup,
  Reveal,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS, priceLabel } from "@/lib/labels";
import { toQuickView } from "@/lib/vendor-quick-view";
import { SafeImg } from "@/components/safe-img";

/* ─── Section shell ───────────────────────────────────────────────────────── */

export function StorySection({
  id,
  eyebrow,
  title,
  action,
  children,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-52">
      <Reveal className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
            <span className="h-px w-8 bg-primary/50" /> {eyebrow}
          </p>
          <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-4xl">{title}</h2>
        </div>
        {action}
      </Reveal>
      {children}
    </section>
  );
}

/* ─── Sticky bar that appears once the hero scrolls away ─────────────────── */

export function VendorStickyBar({
  watch,
  name,
  photo,
  rating,
  price,
  saved,
  onSave,
}: {
  watch: React.RefObject<HTMLElement | null>;
  name: string;
  photo?: string | null;
  rating?: number;
  price: string;
  saved?: boolean;
  onSave?: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = watch.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry?.isIntersecting), {
      rootMargin: "-80px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 top-20 z-40 mx-auto hidden max-w-5xl md:block"
        >
          <div className="flex items-center gap-3 rounded-full border border-border bg-background/85 p-1.5 pr-2 shadow-raised backdrop-blur-xl">
            <SafeImg src={photo} className="size-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight">{name}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                {rating ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-primary text-primary" /> {rating.toFixed(1)}
                  </span>
                ) : null}
                <span className="truncate">{price}</span>
              </p>
            </div>
            {onSave ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={onSave}
                aria-pressed={saved}
                aria-label={saved ? "Remove from team" : "Save to team"}
                className={cn(
                  "grid size-10 place-items-center rounded-full border border-border transition hover:border-primary/40",
                  saved && "border-primary bg-primary/10 text-primary",
                )}
              >
                <Heart className={cn("size-4", saved && "fill-current")} />
              </motion.button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ─── Section menu with scrollspy ─────────────────────────────────────────── */

export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <LayoutGroup id="vendor-section-nav">
      <nav className="sticky top-20 z-30 md:top-36 -mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex gap-1 rounded-full border border-border bg-background/85 p-1 shadow-card backdrop-blur-xl">
          {sections.map((section) => {
            const isActive = section.id === active;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActive(section.id)}
                className={cn(
                  "relative isolate inline-flex h-10 items-center rounded-full px-4 text-sm whitespace-nowrap transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="vendor-section-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                {section.label}
              </a>
            );
          })}
        </div>
      </nav>
    </LayoutGroup>
  );
}

/* ─── Trust badges ───────────────────────────────────────────────────────── */

export function TrustBadges({ vendor }: { vendor: Vendor }) {
  const badges = [
    vendor.verified ? { icon: BadgeCheck, title: "Verified", body: "Identity & business checked" } : null,
    vendor.whatsapp ? { icon: MessageCircle, title: "WhatsApp ready", body: "Chat directly with the vendor" } : null,
    vendor.couplesServed
      ? { icon: Users, title: `${vendor.couplesServed}+ couples`, body: "Weddings delivered" }
      : null,
    vendor.yearsExperience
      ? { icon: Clock, title: `${vendor.yearsExperience} years`, body: "In the wedding business" }
      : null,
    vendor.ratingAvg
      ? {
          icon: Star,
          title: `${vendor.ratingAvg.toFixed(1)} rating`,
          body: `${vendor.ratingCount ?? 0} couple reviews`,
        }
      : null,
    vendor.destinationExperienced
      ? { icon: Plane, title: "Destination ready", body: "Travels across the island" }
      : null,
  ].filter(Boolean) as { icon: typeof Star; title: string; body: string }[];

  if (!badges.length) return null;
  return (
    <Stagger
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      stagger={0.05}
    >
      {badges.map((badge) => (
        <StaggerItem key={badge.title} className="h-full shrink-0">
          <div
            title={badge.body}
            className="group inline-flex h-full items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-1.5 transition-colors hover:border-primary/40"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <badge.icon className="size-3.5" />
            </span>
            <span className="text-sm font-medium whitespace-nowrap">{badge.title}</span>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/* ─── Signature work story cards ─────────────────────────────────────────── */

export function ProjectStories({
  projects,
  onOpen,
}: {
  projects: { id: string; title: string; coverUrl?: string | null; items: { url: string }[] }[];
  onOpen: (id: string) => void;
}) {
  // A single project is already an album tab in the collage — only show stories when there are several.
  if (projects.length < 2) return null;
  return (
    <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {projects.map((project, index) => (
        <motion.button
          key={project.id}
          type="button"
          onClick={() => onOpen(project.id)}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.07, duration: 0.5 }}
          className="group relative isolate h-56 w-44 shrink-0 snap-start overflow-hidden rounded-3xl text-left shadow-card sm:w-52"
        >
          <SafeImg
            src={project.coverUrl ?? project.items[0]?.url}
            fallbackIndex={index}
            className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
            <p className="text-label tracking-eyebrow text-paper/70 uppercase">Story · {project.items.length} photos</p>
            <p className="mt-1 font-serif text-xl leading-tight">{project.title}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ─── Reviews carousel ───────────────────────────────────────────────────── */

export function ReviewCarousel({
  reviews,
}: {
  reviews: { id: string; authorName: string; rating: number; body: string }[];
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  if (!reviews.length) return null;
  const review = reviews[index % reviews.length]!;
  const go = (step: number) => {
    setDir(step);
    setIndex((current) => (current + step + reviews.length) % reviews.length);
  };
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <Quote className="absolute top-5 right-6 size-16 text-primary/10" />
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={review.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid min-h-40 gap-4"
        >
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-4", i < review.rating ? "fill-primary text-primary" : "text-border")} />
            ))}
          </div>
          <p className="font-serif text-xl leading-snug text-balance sm:text-2xl">&ldquo;{review.body}&rdquo;</p>
          <p className="flex items-center gap-3 text-sm">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 font-serif text-primary">
              {review.authorName.slice(0, 1)}
            </span>
            <span className="font-medium">{review.authorName}</span>
          </p>
        </motion.div>
      </AnimatePresence>
      {reviews.length > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {reviews.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Review ${i + 1}`}
                onClick={() => {
                  setDir(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-1.5 bg-border")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((step) => (
              <button
                key={step}
                type="button"
                aria-label={step < 0 ? "Previous review" : "Next review"}
                onClick={() => go(step)}
                className="grid size-9 place-items-center rounded-full border border-border transition hover:border-primary/40 hover:text-primary"
              >
                {step < 0 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── FAQ accordion ──────────────────────────────────────────────────────── */

export function FaqList({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!faqs.length) return <p className="text-sm text-muted-foreground">No FAQs yet.</p>;
  return (
    <div className="grid gap-2">
      {faqs.map((faq, index) => {
        const isOpen = open === index;
        return (
          <div
            key={`${faq.question}-${index}`}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors",
              isOpen ? "border-primary/40 shadow-card" : "border-border",
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <span className="flex-1 font-medium">{faq.question}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown className="size-4 text-muted-foreground" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Stepped inquiry ───────────────────────────────────────────────────── */

export function InquiryStepper({
  packages,
  selectedPackageId,
  onSelectPackage,
  preferredDate,
  setPreferredDate,
  message,
  setMessage,
  onSubmit,
  status,
  whatsappUrl,
  fallbackWhatsapp,
  onWhatsapp,
}: {
  packages: { id: string; name: string; priceLabel: string }[];
  selectedPackageId: string | null;
  onSelectPackage: (id: string | null) => void;
  preferredDate: string;
  setPreferredDate: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  onSubmit: (guests: string) => Promise<boolean>;
  status: string | null;
  whatsappUrl: string | null;
  fallbackWhatsapp: string | null;
  onWhatsapp: () => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const steps = ["Date", "Details", "Message"];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setSending(true);
    const ok = await onSubmit(guests);
    setSending(false);
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <CelebrationBurst trigger={sent}>
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid justify-items-center gap-3 py-4 text-center"
        >
          <motion.span
            initial={reduce ? false : { scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
            className="grid size-14 place-items-center rounded-full bg-success text-success-foreground shadow-md"
          >
            <Check className="size-7" />
          </motion.span>
          <p className="font-serif text-2xl">Inquiry sent!</p>
          <p className="text-sm text-muted-foreground">{status ?? "The vendor will be in touch soon."}</p>
          {whatsappUrl || fallbackWhatsapp ? (
            <Button asChild shape="pill" className="w-full">
              <a href={whatsappUrl ?? fallbackWhatsapp ?? "#"} target="_blank" rel="noreferrer" onClick={onWhatsapp}>
                <MessageCircle className="size-4" /> Continue on WhatsApp
              </a>
            </Button>
          ) : null}
        </motion.div>
      </CelebrationBurst>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-4">
      <div className="grid grid-cols-3 gap-1.5">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index <= step && setStep(index)}
            className="grid gap-1.5 text-left"
          >
            <span className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className="block h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: index <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className={cn("text-xs", index === step ? "font-medium text-foreground" : "text-muted-foreground")}>
              {index + 1}. {label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="grid gap-3"
        >
          {step === 0 ? (
            <>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4 text-primary" /> When is the big day?
              </p>
              <DatePicker value={preferredDate} onChange={setPreferredDate} placeholder="Pick a date (optional)" />
            </>
          ) : step === 1 ? (
            <>
              <label className="grid gap-1.5 text-sm font-medium">
                Guest count
                <Input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(event) => setGuests(event.target.value)}
                  placeholder="e.g. 300"
                />
              </label>
              {packages.length ? (
                <div className="grid gap-1.5">
                  <p className="text-sm font-medium">Package</p>
                  {packages.map((pack) => {
                    const active = pack.id === selectedPackageId;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => onSelectPackage(active ? null : pack.id)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm ring-1 transition",
                          active ? "bg-primary/10 ring-primary/50" : "bg-background ring-border hover:ring-primary/30",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-4 place-items-center rounded-full ring-1",
                              active ? "bg-primary text-primary-foreground ring-primary" : "ring-border",
                            )}
                          >
                            {active ? <Check className="size-3" /> : null}
                          </span>
                          {pack.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{pack.priceLabel}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <label className="grid gap-1.5 text-sm font-medium">
              Anything they should know?
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-28" />
            </label>
          )}
        </motion.div>
      </AnimatePresence>

      {status && !sent ? <p className="text-xs text-destructive">{status}</p> : null}
      <div className="flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" shape="pill" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : null}
        <Button type="submit" shape="pill" className="group flex-1" disabled={sending}>
          <span className="inline-flex items-center gap-2">
            {step < 2 ? "Continue" : sending ? "Sending…" : "Send inquiry"}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </div>
    </form>
  );
}

/* ─── Similar vendors ───────────────────────────────────────────────────── */

export function SimilarVendors({
  vendor,
  currency,
  inquireLabel,
}: {
  vendor: Vendor;
  currency: string;
  inquireLabel: string;
}) {
  const [items, setItems] = useState<Vendor[]>([]);
  const [quickId, setQuickId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.vendors
      .list({ category: vendor.category, pageSize: 12 })
      .then((result) => {
        const others = result.items.filter((item) => item.id !== vendor.id);
        others.sort((a, b) => Number(b.district === vendor.district) - Number(a.district === vendor.district));
        setItems(others.slice(0, 8));
      })
      .catch(() => setItems([]));
  }, [vendor.id, vendor.category, vendor.district]);

  if (!items.length) return null;
  const label = (item: Vendor) => CATEGORY_LABELS[item.category] ?? item.category;
  const price = (item: Vendor) =>
    priceLabel(item.startingPriceLkr, currency, item.priceDisplayMode, item.showPricing, inquireLabel);
  const quick = items.find((item) => item.id === quickId) ?? null;

  return (
    <section>
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
            <span className="h-px w-8 bg-primary/50" /> Keep exploring
          </p>
          <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Similar {label(vendor).toLowerCase()} near {vendor.district}
          </h2>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((step) => (
            <button
              key={step}
              type="button"
              aria-label={step < 0 ? "Scroll left" : "Scroll right"}
              onClick={() => scroller.current?.scrollBy({ left: step * 340, behavior: "smooth" })}
              className="grid size-10 place-items-center rounded-full border border-border bg-card transition hover:border-primary/40 hover:text-primary"
            >
              {step < 0 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ))}
        </div>
      </Reveal>
      <div ref={scroller} className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none]">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06, duration: 0.5 }}
            className="w-72 shrink-0 snap-start sm:w-80"
          >
            <VendorCard
              href={`/vendors/${item.slug}`}
              linkAs={Link}
              name={item.name}
              category={label(item)}
              location={`${item.city}, ${item.district}`}
              priceBand={price(item)}
              imageSrc={item.photoUrl}
              photos={item.photos}
              rating={item.ratingAvg}
              ratingCount={item.ratingCount}
              verified={item.verified}
              featured={item.featured}
              onQuickView={() => setQuickId(item.id)}
            />
          </motion.div>
        ))}
      </div>
      <VendorQuickView
        open={Boolean(quick)}
        onOpenChange={(open) => !open && setQuickId(null)}
        linkAs={Link}
        vendor={quick ? toQuickView(quick, label(quick), price(quick)) : null}
      />
    </section>
  );
}

/* ─── Compact tabbed card (details / FAQs / location) ───────────────────── */

export function InfoTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const reduce = useReducedMotion();
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];
  return (
    <div className="rounded-3xl border border-border bg-card p-2 shadow-card">
      <LayoutGroup id="vendor-info-tabs">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-background p-1 [scrollbar-width:none]">
          {tabs.map((tab) => {
            const isActive = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative isolate h-9 flex-1 rounded-xl px-4 text-sm whitespace-nowrap transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="vendor-info-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-card shadow-card"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                {tab.label}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current?.id}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="p-4"
        >
          {current?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
