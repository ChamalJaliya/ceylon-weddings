"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Search,
  Settings,
  Share2,
  Smartphone,
  Star,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { RATES_TO_LKR, usePreferenceStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Pricing } from "@ceylonweddings/ui/domain/pricing";
import {
  AnimatePresence,
  LayoutGroup,
  Reveal,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import { SpotlightCard } from "@/components/spotlight-card";
import { CATEGORY_ICONS } from "@/lib/category-media";
import { FinalCta, HeroStats, HowItWorksTimeline, SectionHeading, ToolsShowcase } from "@/features/home/home-sections";

export type Audience = "couples" | "vendors";

const img = (index: number, width = 1400) =>
  (WEDDING_IMAGES[index % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0]).replace("w=2000", `w=${width}`);

/* ─── Content ─────────────────────────────────────────────────────────────── */

const HERO: Record<
  Audience,
  { eyebrow: string; title: ReactNode; sub: string; image: number; cta: { href: string; label: string } }
> = {
  couples: {
    eyebrow: "For couples · Free",
    title: (
      <>
        Plan your Sri Lankan wedding, <em className="text-paper/90 italic">all in one place</em>
      </>
    ),
    sub: "Find trusted vendors, keep every ceremony on track and share a beautiful wedding website with your guests.",
    image: 0,
    cta: { href: "/register", label: "Start planning" },
  },
  vendors: {
    eyebrow: "For wedding pros",
    title: (
      <>
        Reach couples planning their <em className="text-paper/90 italic">Sri Lankan</em> wedding
      </>
    ),
    sub: "Free listing, zero commissions and direct WhatsApp inquiries from couples who are ready to book.",
    image: 5,
    cta: { href: "/register?role=VENDOR", label: "List your business free" },
  },
};

const COUPLE_STEPS: { title: string; body: string; icon: LucideIcon; image: number }[] = [
  {
    title: "Create your profile",
    body: "Add partner names, city, guest estimate, budget band and your ceremony types: poruwa, church, nikah, walima, homecoming.",
    icon: Heart,
    image: 1,
  },
  {
    title: "Browse the marketplace",
    body: "Filter by category, city, district, price and rating. See verified badges and featured picks at a glance.",
    icon: Search,
    image: 3,
  },
  {
    title: "Inquire on WhatsApp",
    body: "Tap Inquire on any vendor. We log it and open WhatsApp, so the conversation stays where it already lives.",
    icon: MessageCircle,
    image: 5,
  },
  {
    title: "Manage your planning",
    body: "Checklist tasks follow Sri Lankan ceremony logic. The budget tracks LKR across bride's family, groom's family and the couple.",
    icon: Settings,
    image: 2,
  },
  {
    title: "Share your wedding website",
    body: "A free public page for guests with RSVPs, the schedule and your story.",
    icon: Share2,
    image: 6,
  },
];

const VENDOR_STEPS = [
  {
    title: "Create your listing",
    body: "Sign up as a vendor, add your business details and upload your best work, services and pricing.",
  },
  {
    title: "Get discovered",
    body: "Couples browsing your category and district see your profile. Featured vendors also appear on the home page.",
  },
  {
    title: "Connect on WhatsApp",
    body: "Couples message you directly and every inquiry lands in your dashboard too. No middleman, no commission.",
  },
];

const VENDOR_BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Wallet,
    title: "Free to list",
    body: "No booking commissions or hidden charges. Create your profile, upload your portfolio and start receiving leads.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-native leads",
    body: "Couples reach you directly on WhatsApp. We never hide your contact details or sit in the middle of your chats.",
  },
  {
    icon: BadgeCheck,
    title: "Verified badge",
    body: "Complete verification to earn the verified tick and stand out to couples who are ready to book.",
  },
];

const VENDOR_STATS = [
  { value: "1,200+", label: "Couples" },
  { value: "250+", label: "Vendors" },
  { value: "4.9", label: "Average rating" },
  { value: "Free", label: "To list" },
];

const VENDOR_CATEGORIES = [
  "VENUE",
  "PHOTO_VIDEO",
  "PORUWA",
  "BRIDAL_WEAR",
  "FLORIST_DECOR",
  "CATERER",
  "CAKE",
  "WEDDING_CARS",
  "HAIR_MAKEUP",
  "ENTERTAINMENT",
  "MEHNDI",
  "ASTROLOGY",
  "INVITATIONS",
  "PLANNER",
];
const CATEGORY_NAMES: Record<string, string> = {
  VENUE: "Venues",
  PHOTO_VIDEO: "Photo & video",
  PORUWA: "Poruwa specialists",
  BRIDAL_WEAR: "Bridal wear",
  FLORIST_DECOR: "Florist & decor",
  CATERER: "Catering",
  CAKE: "Cake",
  WEDDING_CARS: "Wedding cars",
  HAIR_MAKEUP: "Hair & makeup",
  ENTERTAINMENT: "Entertainment",
  MEHNDI: "Mehndi",
  ASTROLOGY: "Astrology & nekath",
  INVITATIONS: "Invitations",
  PLANNER: "Planners",
};

const FAQS: Record<Audience, { q: string; a: string }[]> = {
  couples: [
    { q: "Is it free?", a: "Yes. All planning tools for couples are completely free." },
    {
      q: "How does the WhatsApp inquiry work?",
      a: "When you tap Inquire on a vendor, we log the lead and open WhatsApp pre-filled with your wedding details. The conversation continues directly on WhatsApp.",
    },
    {
      q: "Can I have multiple ceremonies?",
      a: "Yes. Add as many as you need (poruwa, church, nikah, walima, homecoming) and the checklist adapts.",
    },
  ],
  vendors: [
    {
      q: "Does it cost anything to list?",
      a: "No. A standard listing is free, and you can upgrade to Pro when you want more visibility.",
    },
    {
      q: "Do you take a commission?",
      a: "Never. Couples contact you directly and you close the booking on your own terms.",
    },
    {
      q: "How do I get the verified badge?",
      a: "Complete the verification steps in your vendor dashboard. Once approved, the badge appears on your listing.",
    },
  ],
};

/* ─── Building blocks ─────────────────────────────────────────────────────── */

function AudienceSwitch({ value, onChange }: { value: Audience; onChange: (value: Audience) => void }) {
  const options: { id: Audience; label: string; icon: LucideIcon }[] = [
    { id: "couples", label: "For couples", icon: Heart },
    { id: "vendors", label: "For vendors", icon: Store },
  ];
  return (
    <LayoutGroup id="audience-switch">
      <div
        role="tablist"
        className="inline-flex self-start rounded-full border border-paper/20 bg-paper/10 p-1 backdrop-blur-md"
      >
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-colors",
                active ? "text-ink" : "text-paper/80 hover:text-paper",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="audience-pill"
                  className="absolute inset-0 rounded-full bg-paper shadow-md"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <option.icon className="relative size-4" />
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function StoryStep({ step, index }: { step: (typeof COUPLE_STEPS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);
  const flip = index % 2 === 1;

  return (
    <div ref={ref} className="relative grid items-center gap-6 md:grid-cols-2 md:gap-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, x: flip ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn("relative aspect-[4/3] overflow-hidden rounded-3xl shadow-raised", flip && "md:order-2")}
      >
        <motion.img
          src={img(step.image, 1200)}
          alt=""
          loading="lazy"
          style={{ y }}
          className="absolute inset-0 h-[120%] w-full -translate-y-[10%] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
        <span className="absolute bottom-4 left-5 font-serif text-6xl leading-none text-paper/90">
          {String(index + 1).padStart(2, "0")}
        </span>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(flip && "md:order-1 md:text-right")}
      >
        <motion.span
          whileHover={reduce ? undefined : { rotate: -8, scale: 1.1 }}
          className={cn(
            "mb-5 inline-grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md",
          )}
        >
          <Icon icon={step.icon} size="md" lottie={false} />
        </motion.span>
        <h3 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">{step.title}</h3>
        <p className={cn("mt-3 max-w-md text-base leading-relaxed text-muted-foreground", flip && "md:ml-auto")}>
          {step.body}
        </p>
      </motion.div>
    </div>
  );
}

function CoupleStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 50%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section>
      <SectionHeading
        align="center"
        eyebrow="Your journey"
        title="Five steps from 'yes' to 'I do'"
        sub="Your end-to-end planning hub, designed for Sri Lankan traditions."
      />
      <div ref={ref} className="relative grid gap-16 md:gap-24">
        <div className="absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-border md:block">
          <motion.div
            style={{ scaleY }}
            className="h-full w-full origin-top bg-gradient-to-b from-primary via-love to-primary"
          />
        </div>
        {COUPLE_STEPS.map((step, index) => (
          <StoryStep key={step.title} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}

function VendorStory() {
  const currency = usePreferenceStore((state) => state.currency);
  const rate = RATES_TO_LKR[currency] ?? 1;

  return (
    <>
      <section>
        <SectionHeading
          eyebrow="Why Ceylon Weddings"
          title="Built for Sri Lankan wedding businesses"
          sub="We designed the platform around how local vendors already work."
        />
        <Stagger className="grid gap-5 md:grid-cols-3" stagger={0.08}>
          {VENDOR_BENEFITS.map((benefit) => (
            <StaggerItem key={benefit.title} className="h-full">
              <SpotlightCard {...benefit} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <HowItWorksTimeline
        eyebrow="How it works"
        title="Start getting inquiries in three steps"
        sub="Set up once, then let couples come to you."
        steps={VENDOR_STEPS}
        icons={[LayoutDashboard, Users, Smartphone]}
      />

      <section id="pricing" className="scroll-mt-24 overflow-visible">
        <Pricing
          currency={currency}
          defaultAnnual
          annualSavingsLabel="Save 25%"
          title="Vendor membership"
          description={
            "List for free, then upgrade when you want ranking, galleries and analytics.\nAnnual billing saves 25% on Pro."
          }
          linkAs={Link}
          plans={[
            {
              name: "Standard Partner",
              price: 0,
              yearlyPrice: 0,
              period: "first 3 months",
              priceLabel: "Free",
              features: [
                "Standard directory listing",
                "Up to 3 portfolio photos",
                "WhatsApp inquiries from couples",
                "No booking commissions",
              ],
              description: "Basic listing for emerging professionals starting their wedding portfolio.",
              buttonText: "List your business",
              href: "/register?role=VENDOR",
              isPopular: false,
            },
            {
              name: "Ceylon Weddings Pro",
              price: 4900 / rate,
              yearlyPrice: 45000 / 12 / rate,
              period: "month",
              features: [
                "Direct WhatsApp couple inquiries with verified lead alerts",
                "High-resolution media projects, galleries, and showcase videos",
                "Ranking priority in district and category search",
                "Reviews, analytics, and featured candidate queues",
              ],
              description: "Full visibility across Sri Lanka and diaspora couples planning weddings.",
              buttonText: "Get Pro",
              href: "/pro/billing",
              isPopular: true,
            },
            {
              name: "Spotlight",
              price: 0,
              yearlyPrice: 0,
              period: "campaign",
              priceLabel: "Custom",
              features: [
                "Catalog top and home pick placements",
                "District and category targeting",
                "Creative studio with completeness checklist",
                "Pay only when you want extra visibility",
              ],
              description: "Boost a campaign on top of Pro when you have dates to fill.",
              buttonText: "Create a campaign",
              href: "/pro/promote",
              isPopular: false,
            },
          ]}
        />
      </section>

      <section>
        <SectionHeading align="center" eyebrow="Categories we cover" title="There's a place for every wedding pro" />
        <Stagger className="flex flex-wrap justify-center gap-3" stagger={0.03}>
          {VENDOR_CATEGORIES.map((key) => {
            const CategoryIcon = CATEGORY_ICONS[key] ?? Store;
            return (
              <StaggerItem key={key}>
                <Link
                  href={`/vendors?category=${key}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <CategoryIcon className="size-4 text-primary transition-transform group-hover:scale-110" />
                  {CATEGORY_NAMES[key]}
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <Reveal className="relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center text-paper sm:px-16 sm:py-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(3, 1800)} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink/75 via-ink/55 to-primary/40" />
        <Star className="mx-auto mb-6 size-8 fill-paper/80 text-paper/80" />
        <blockquote className="mx-auto max-w-3xl font-serif text-2xl leading-snug text-balance sm:text-4xl">
          &ldquo;Ceylon Weddings connected us with the right couples. We get WhatsApp inquiries within hours of updating
          our listing.&rdquo;
        </blockquote>
        <p className="mt-6 text-sm text-paper/80">Amara Studios · Colombo</p>
      </Reveal>
    </>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <section className="mx-auto w-full max-w-3xl">
      <SectionHeading align="center" eyebrow="Questions" title="Good to know" />
      <div className="grid gap-3">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <Reveal key={item.q} delay={index * 0.05}>
              <div
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
                  <CheckCircle2
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      isOpen ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 font-medium">{item.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="px-5 pb-5 pl-13 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <Button asChild variant="ghost" shape="pill">
          <Link href="/faq" className="inline-flex items-center gap-1.5">
            Read all FAQs <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function HowItWorksContent({ initialAudience = "couples" }: { initialAudience?: Audience }) {
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const reduce = useReducedMotion();
  const hero = HERO[audience];

  function switchTo(next: Audience) {
    setAudience(next);
    try {
      const url = new URL(window.location.href);
      if (next === "vendors") url.searchParams.set("for", "vendors");
      else url.searchParams.delete("for");
      window.history.replaceState(null, "", url);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-ink">
          <AnimatePresence initial={false}>
            <motion.img
              key={hero.image}
              src={img(hero.image, 2000)}
              alt=""
              aria-hidden
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 -z-10 size-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/25" />

          <div className="flex min-h-[32rem] flex-col justify-end gap-8 px-6 py-10 sm:px-12 sm:py-14">
            <AudienceSwitch value={audience} onChange={switchTo} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={audience}
                initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduce ? undefined : { opacity: 0, y: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl text-paper"
              >
                <p className="mb-3 text-label font-medium tracking-eyebrow text-paper/70 uppercase">{hero.eyebrow}</p>
                <h1 className="font-serif text-4xl leading-tight font-medium tracking-tight text-balance sm:text-6xl">
                  {hero.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/80 sm:text-h4">{hero.sub}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild shape="pill" size="lg" className="group">
                    <Link href={hero.cta.href} className="inline-flex items-center gap-2">
                      {hero.cta.label}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  {audience === "vendors" ? (
                    <Button
                      asChild
                      shape="pill"
                      size="lg"
                      variant="outline"
                      className="border-paper/40 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
                    >
                      <a href="#pricing">See pricing</a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      shape="pill"
                      size="lg"
                      variant="outline"
                      className="border-paper/40 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
                    >
                      <Link href="/vendors">Browse vendors</Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {audience === "vendors" ? (
              <HeroStats stats={VENDOR_STATS} icons={[Users, Store, Star, BadgeCheck]} />
            ) : null}
          </div>
        </div>
      </section>

      {/* Audience content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={audience}
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid w-full max-w-6xl gap-24 px-6 py-20 sm:gap-32"
        >
          {audience === "couples" ? (
            <>
              <CoupleStory />
              <ToolsShowcase ctaLabel="Create your wedding" />
            </>
          ) : (
            <VendorStory />
          )}

          <Faq key={`faq-${audience}`} items={FAQS[audience]} />

          {audience === "couples" ? (
            <FinalCta
              primary={{ href: "/register", label: "Start planning" }}
              secondary={{ href: "/vendors", label: "Browse vendors" }}
            />
          ) : (
            <FinalCta
              title="Ready to list your business?"
              sub="Join 250+ Sri Lankan wedding vendors already getting leads on Ceylon Weddings."
              image={5}
              primary={{ href: "/register?role=VENDOR", label: "Create free account" }}
              secondary={{ href: "#pricing", label: "See pricing" }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
