"use client";

import { ArrowRight, Heart, MapPin, MessageCircle, Shield, Sparkles, Star, Users ,type  LucideIcon } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Link } from "@/i18n/navigation";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import type { AboutStory } from "./about-story";
import { FinalCta, HeroStats, PlacesMarquee, SectionHeading } from "@/features/home/home-sections";

const img = (index: number, width = 1600) =>
  (WEDDING_IMAGES[index % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0]).replace("w=2000", `w=${width}`);

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

const STAT_ICONS = [Shield, Users, Star, MapPin];
const PILLAR_ICONS: LucideIcon[] = [Sparkles, MessageCircle, Users, Heart];

export function AboutContent({ story, stats }: { story: AboutStory; stats: { value: string; label: string }[] }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-20 pb-10 sm:gap-28">
      {/* Hero */}
      <section className="relative isolate -mx-2 overflow-hidden rounded-3xl sm:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(3, 2000)} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/20" />
        <div className="flex min-h-[34rem] flex-col justify-end gap-10 px-6 pt-32 pb-6 sm:min-h-[40rem] sm:px-12 sm:pb-10">
          <Reveal className="max-w-3xl text-paper">
            <p className="mb-4 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-paper/80 uppercase">
              <span className="h-px w-8 bg-paper/60" />
              Our story
            </p>
            <h1 className="font-serif text-5xl font-medium tracking-tight text-balance sm:text-7xl">
              {story.heading ?? story.title}
            </h1>
            {story.excerpt && norm(story.excerpt) !== norm(story.heading ?? story.title) ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/85 sm:text-h4">{story.excerpt}</p>
            ) : null}
          </Reveal>
          {stats.length ? <HeroStats stats={stats} icons={STAT_ICONS} /> : null}
        </div>
      </section>

      {/* Story */}
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="grid gap-6">
          <p className="inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
            <span className="h-px w-8 bg-primary/50" />
            Why we exist
          </p>
          {story.lead ? (
            <p className="font-serif text-3xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
              {story.lead.split(". ").map((sentence, index, all) => (
                <span key={index} className={index % 2 === 1 ? "text-primary" : undefined}>
                  {sentence}
                  {index < all.length - 1 ? ". " : ""}
                </span>
              ))}
            </p>
          ) : null}
          <div className="grid gap-4 text-base leading-relaxed text-muted-foreground sm:text-h4">
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild shape="pill" size="lg">
              <Link href="/vendors">
                Browse vendors <Icon icon={ArrowRight} size="xs" lottie={false} />
              </Link>
            </Button>
            <Button asChild shape="pill" size="lg" variant="outline">
              <Link href="/planning">Start planning free</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal className="relative grid grid-cols-2 gap-3 sm:gap-4" delay={0.1}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(1, 900)} alt="" className="aspect-[3/4] w-full rounded-3xl object-cover shadow-card" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(5, 900)} alt="" className="mt-12 aspect-[3/4] w-full rounded-3xl object-cover shadow-card" />
          <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 px-5 py-3 shadow-dock backdrop-blur">
            <Heart className="size-4 fill-love text-love" aria-hidden />
            <span className="text-sm font-medium whitespace-nowrap">Poruwa · Church · Nikah · Hindu</span>
          </div>
        </Reveal>
      </section>

      {/* Pillars */}
      {story.pillars.length ? (
        <section>
          <SectionHeading
            eyebrow="What makes us different"
            title={
              <>
                Made for how Sri Lanka <em className="text-primary not-italic">really</em> weds
              </>
            }
            align="center"
          />
          <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5">
            {story.pillars.map((pillar, index) => {
              const PillarIcon = PILLAR_ICONS[index % PILLAR_ICONS.length]!;
              return (
                <StaggerItem key={pillar.title}>
                  <article className="group relative grid h-full content-start gap-5 overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <PillarIcon className="size-5" aria-hidden />
                      </span>
                      <span className="font-serif text-5xl text-muted-foreground/20 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <h3 className="font-serif text-2xl font-medium tracking-tight">{pillar.title}</h3>
                      <p className="leading-relaxed text-muted-foreground">{pillar.body}</p>
                    </div>
                    <span className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary to-love transition-transform duration-500 group-hover:scale-x-100" />
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      ) : null}

      <div className="-mx-6 min-w-0 overflow-hidden">
        <PlacesMarquee />
      </div>

      <FinalCta
        title="Let’s plan your day together"
        sub="Verified vendors, planning tools and a wedding website — free for couples, everywhere on the island."
        primary={{ href: "/planning", label: "Start planning free" }}
        secondary={{ href: "/register?role=VENDOR", label: "List your business" }}
        image={6}
      />
    </div>
  );
}
