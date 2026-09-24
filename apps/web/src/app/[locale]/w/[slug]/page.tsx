"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@ceylonweddings/web";
import { formatWeddingDateLabel, type PublicWebsite } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import {
  CeremonySchedule,
  FaqAccordion,
  GuestSiteHero,
  OurTeamStrip,
  TravelGuideBlock,
} from "@ceylonweddings/ui/domain/wedding-presentation";
import { Reveal, PageTransition, motion } from "@ceylonweddings/ui/domain/motion";
import { Link } from "../../../../i18n/navigation";
import { CATEGORY_LABELS } from "../../../../lib/labels";

const HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";

export default function GuestWebsitePage() {
  const params = useParams<{ slug: string }>();
  const [site, setSite] = useState<PublicWebsite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.public.wedding(params.slug).then(setSite).catch((err: Error) => setError(err.message));
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
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </motion.div>
    );
  }

  const names = `${site.partnerOneName} & ${site.partnerTwoName}`;
  const place = [site.city, site.district].filter(Boolean).join(", ");

  function formatWhen(iso: string | null | undefined) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <PageTransition className="mx-auto cw-stack max-w-4xl px-4 py-10 sm:px-6">
      <GuestSiteHero
        imageSrc={HERO}
        names={names}
        date={formatWeddingDateLabel(site.date)}
        place={place}
        actions={
          <Button asChild size="lg">
            <Link href={`/w/${site.slug}/rsvp`}>RSVP</Link>
          </Button>
        }
      />

      <section className="grid gap-4">
        <Reveal direction="none" delay={0.05}>
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Ceremony</p>
        </Reveal>
        <CeremonySchedule events={site.events} formatWhen={formatWhen} />
      </section>

      <TravelGuideBlock notes={site.travelNotes} />

      {site.websiteFaq ? (
        <section className="grid gap-4">
          <Reveal direction="none" delay={0.05}>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">FAQ</p>
          </Reveal>
          <FaqAccordion faq={site.websiteFaq} />
        </section>
      ) : null}

      {(site.team ?? []).length ? (
        <section className="grid gap-4">
          <Reveal direction="none" delay={0.05}>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Our team</p>
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
        <div className="flex justify-center pb-10">
          <Button asChild size="lg">
            <Link href={`/w/${site.slug}/rsvp`}>Confirm your RSVP</Link>
          </Button>
        </div>
      </Reveal>
    </PageTransition>
  );
}

