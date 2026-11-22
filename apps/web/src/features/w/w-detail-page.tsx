"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@ceylonweddings/web";
import { formatWeddingDateLabel, resolveWeddingCoverUrl, type PublicWebsite } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import {
  CeremonySchedule,
  FaqAccordion,
  GuestSiteHero,
  OurTeamStrip,
  TravelGuideBlock,
} from "@ceylonweddings/ui/domain/wedding-presentation";
import { Reveal, PageTransition, motion } from "@ceylonweddings/ui/domain/motion";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { CelebrationBackdrop, celebrationThemeFor } from "@/components/celebration-backdrop";

export default function GuestWebsitePage() {
  const params = useParams<{ slug: string }>();
  const [site, setSite] = useState<PublicWebsite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.public
      .wedding(params.slug)
      .then(setSite)
      .catch((err: Error) => setError(err.message));
  }, [params.slug]);

  if (error) {
    return (
      <motion.div
        className="mx-auto max-w-lg py-20 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-serif text-2xl">This wedding site is unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </motion.div>
    );
  }
  if (!site) {
    return (
      <motion.div
        className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="h-1.5 w-24 rounded-full bg-primary/30"
          animate={{ scaleX: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <CenteredLoader label="Loading invitation…" />
      </motion.div>
    );
  }

  const names = `${site.partnerOneName} & ${site.partnerTwoName}`;
  const place = [site.city, site.district].filter(Boolean).join(", ");

  function formatWhen(iso: string | null | undefined) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  }

  const theme = celebrationThemeFor(site.events.map((event) => event.kind));

  return (
    <>
      <PageTransition className="relative mx-auto cw-stack max-w-4xl px-4 py-10 sm:px-6">
        <div className="relative isolate -mx-2 px-2 py-6 sm:-mx-16 sm:px-16 sm:py-10">
          <CelebrationBackdrop theme={theme} seed={site.slug.length} />
          <GuestSiteHero
            imageSrc={resolveWeddingCoverUrl(site.coverImageUrl)}
            names={names}
            date={formatWeddingDateLabel(site.date)}
            place={place}
            actions={
              <Button asChild size="lg">
                <Link href={`/w/${site.slug}/rsvp`}>RSVP</Link>
              </Button>
            }
          />
        </div>

        <section className="grid gap-4">
          <Reveal direction="none" delay={0.05}>
            <p className="text-label tracking-eyebrow text-muted-foreground uppercase">Ceremony</p>
          </Reveal>
          <CeremonySchedule events={site.events} formatWhen={formatWhen} />
        </section>

        <TravelGuideBlock notes={site.travelNotes} />

        {site.websiteFaq ? (
          <section className="grid gap-4">
            <Reveal direction="none" delay={0.05}>
              <p className="text-label tracking-eyebrow text-muted-foreground uppercase">FAQ</p>
            </Reveal>
            <FaqAccordion faq={site.websiteFaq} />
          </section>
        ) : null}

        {(site.team ?? []).length ? (
          <section className="grid gap-4">
            <Reveal direction="none" delay={0.05}>
              <p className="text-label tracking-eyebrow text-muted-foreground uppercase">Our team</p>
            </Reveal>
            <OurTeamStrip
              items={(site.team ?? []).map((member) => ({
                ...member,
                category: CATEGORY_LABELS[member.category] ?? member.category,
              }))}
              catalogHref={(slug) => `/vendors/${slug}`}
            />
          </section>
        ) : null}

        <Reveal direction="up" y={20} delay={0.1}>
          <div className="relative isolate mx-auto mb-10 flex w-full max-w-md justify-center py-12">
            <CelebrationBackdrop theme={theme} seed={site.slug.length + 3} density="small" />
            <Button asChild size="lg">
              <Link href={`/w/${site.slug}/rsvp`}>Confirm your RSVP</Link>
            </Button>
          </div>
        </Reveal>
      </PageTransition>
    </>
  );
}
