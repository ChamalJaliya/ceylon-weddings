"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Award, CheckCircle2, MapPin, ShieldCheck, Sparkles, Star, Trophy } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { PublicAward } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import {
  AnimatePresence,
  LayoutGroup,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CATEGORY_PHOTOS } from "@/lib/category-media";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/page-hero";
import { SpotlightCard } from "@/components/spotlight-card";
import { FinalCta, SectionHeading } from "@/features/home/home-sections";

const CRITERIA = [
  {
    icon: CheckCircle2,
    title: "Verified couple signal",
    body: "Winners and shortlists come from nominations tied to live, verified vendor storefronts.",
  },
  {
    icon: ShieldCheck,
    title: "Cultural authenticity",
    body: "Recognising expertise across Poruwa, church, Hindu and Nikah traditions.",
  },
  {
    icon: Sparkles,
    title: "Service excellence",
    body: "Every partner moves from nominated, to shortlisted, to winner through an editorial review.",
  },
];

function YearSwitch({ value, onChange }: { value: number; onChange: (year: number) => void }) {
  const years = [value - 1, value, value + 1];
  return (
    <LayoutGroup id="awards-years">
      <div className="inline-flex rounded-full border border-paper/20 bg-paper/10 p-1 backdrop-blur-md">
        {years.map((year) => {
          const active = year === value;
          return (
            <button
              key={year}
              type="button"
              onClick={() => onChange(year)}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm tabular-nums transition-colors",
                active ? "text-ink" : "text-paper/80 hover:text-paper",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="awards-year-pill"
                  className="absolute inset-0 rounded-full bg-paper shadow-md"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{year}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function AwardCard({ award, index, winner }: { award: PublicAward; index: number; winner: boolean }) {
  const [broken, setBroken] = useState(false);
  const fallback =
    CATEGORY_PHOTOS[award.category] ?? WEDDING_IMAGES[index % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0];
  const cover = !broken && award.vendor.coverUrl ? award.vendor.coverUrl : fallback;

  return (
    <Link
      href={`/vendors/${award.vendor.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-500 motion-safe:hover:-translate-y-1.5 hover:shadow-raised"
    >
      <div
        className={cn(
          "relative m-2 mb-0 overflow-hidden rounded-2xl bg-muted",
          winner ? "aspect-[16/10]" : "aspect-[16/9]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <span
          className={cn(
            "absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md",
            winner ? "bg-warning text-warning-foreground shadow-md" : "bg-paper/90 text-ink",
          )}
        >
          {winner ? <Trophy className="size-3.5" /> : <Award className="size-3.5" />}
          {winner ? "Winner" : "Shortlisted"}
        </span>
        <span className="absolute top-3 right-3 grid size-9 translate-x-2 -translate-y-2 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
        <p className="absolute bottom-3 left-4 text-label font-medium tracking-eyebrow text-paper/90 uppercase">
          {CATEGORY_LABELS[award.category] ?? award.category}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-5">
        <h3 className="font-serif text-2xl font-medium tracking-tight group-hover:text-primary">{award.vendor.name}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {[award.vendor.city, award.vendor.district].filter(Boolean).join(", ")}
          </span>
          {award.vendor.ratingAvg != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-foreground">
              <Star className="size-3 fill-primary text-primary" />
              {award.vendor.ratingAvg.toFixed(1)}
              <span className="text-muted-foreground">({award.vendor.reviewCount ?? 0})</span>
            </span>
          ) : null}
        </p>
        {award.notes ? <p className="text-sm leading-relaxed text-muted-foreground">{award.notes}</p> : null}
      </div>
    </Link>
  );
}

function AwardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="cw-shimmer m-2 mb-0 aspect-[16/10] rounded-2xl bg-muted" />
      <div className="grid gap-3 px-5 pt-4 pb-5">
        <div className="cw-shimmer h-6 w-2/3 rounded-full bg-muted" />
        <div className="cw-shimmer h-3 w-40 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function AwardsPage() {
  const reduce = useReducedMotion();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [awards, setAwards] = useState<PublicAward[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void Promise.all([api.site.flags(), api.site.awards(selectedYear)])
      .then(([flags, rows]) => {
        setEnabled(flags["awards.public"] !== false);
        setAwards(rows);
      })
      .catch(() => {
        setAwards([]);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  if (!enabled) {
    return (
      <div className="pb-20">
        <PageHero
          image={2}
          align="center"
          icon={<Trophy className="size-6" />}
          eyebrow="Best of Ceylon"
          title="Awards coming soon"
          sub="The Best of Ceylon awards page is currently unpublished."
        >
          <Button asChild shape="pill" size="lg">
            <Link href="/vendors">Browse vendors</Link>
          </Button>
        </PageHero>
      </div>
    );
  }

  const winners = awards.filter((award) => award.status === "WINNER");
  const shortlist = awards.filter((award) => award.status === "SHORTLISTED");

  return (
    <div className="pb-20">
      <PageHero
        image={2}
        icon={<Trophy className="size-6" />}
        eyebrow="Best of Ceylon"
        title={
          <>
            Best of Ceylon Weddings <em className="text-paper/90 italic">Awards</em>
          </>
        }
        sub="Celebrating trusted wedding vendors across Sri Lanka, chosen from verified couple feedback and service excellence."
      >
        <YearSwitch value={selectedYear} onChange={setSelectedYear} />
      </PageHero>

      <div className="mx-auto grid w-full max-w-6xl gap-24 px-6 py-20 sm:gap-28">
        <section>
          <SectionHeading align="center" eyebrow="How we choose" title="What makes a winner" />
          <Stagger className="grid gap-5 md:grid-cols-3" stagger={0.08}>
            {CRITERIA.map((item) => (
              <StaggerItem key={item.title} className="h-full">
                <SpotlightCard icon={item.icon} title={item.title} body={item.body} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedYear}-${loading ? "loading" : "ready"}`}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-24"
          >
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <AwardSkeleton key={index} />
                ))}
              </div>
            ) : winners.length === 0 && shortlist.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
                <motion.span
                  animate={reduce ? undefined : { y: [0, -8, 0], rotate: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-warning/15 text-warning-fg"
                >
                  <Trophy className="size-7" />
                </motion.span>
                <h3 className="font-serif text-2xl font-medium">The {selectedYear} awards aren&apos;t out yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Winners and the shortlist will appear here once they&apos;re announced.
                </p>
              </div>
            ) : (
              <>
                {winners.length > 0 ? (
                  <section>
                    <SectionHeading eyebrow={`${selectedYear} · ${winners.length} winners`} title="Winners" />
                    <Stagger className="grid gap-5 md:grid-cols-2" stagger={0.08}>
                      {winners.map((award, index) => (
                        <StaggerItem key={award.id} className="h-full">
                          <AwardCard award={award} index={index} winner />
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </section>
                ) : null}
                {shortlist.length > 0 ? (
                  <section>
                    <SectionHeading eyebrow={`${selectedYear} · ${shortlist.length} shortlisted`} title="Shortlist" />
                    <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
                      {shortlist.map((award, index) => (
                        <StaggerItem key={award.id} className="h-full">
                          <AwardCard award={award} index={index + 3} winner={false} />
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </section>
                ) : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <FinalCta
          title="Vendors: get nominated"
          sub="Keep your storefront complete and verified. We nominate standout partners every year."
          image={4}
          primary={{ href: "/register?role=VENDOR", label: "List your business" }}
          secondary={{ href: "/how-it-works?for=vendors", label: "How it works for vendors" }}
        />
      </div>
    </div>
  );
}
