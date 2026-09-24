"use client";

import { useEffect, useState } from "react";
import { Trophy, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { api } from "@ceylonweddings/web";
import type { PublicAward } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { CATEGORY_LABELS } from "../../../lib/labels";
import { Link } from "../../../i18n/navigation";

export default function AwardsPage() {
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
      <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold">Awards coming soon</h1>
        <p className="text-sm text-muted-foreground">
          The Best of Ceylon awards page is currently unpublished.
        </p>
        <Button asChild shape="pill">
          <Link href="/vendors">Browse vendors</Link>
        </Button>
      </div>
    );
  }

  const winners = awards.filter((award) => award.status === "WINNER");
  const shortlist = awards.filter((award) => award.status === "SHORTLISTED");

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-3 py-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Icon icon={Trophy} size="xs" animateOnView />
          Best of Ceylon
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Best of Ceylon Weddings Awards {selectedYear}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Celebrating trusted wedding vendors across Sri Lanka — curated by Ceylon Ops from verified
          couple feedback and service excellence.
        </p>
        <div className="flex justify-center gap-2">
          {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
            <Button
              key={year}
              size="sm"
              variant={year === selectedYear ? "default" : "outline"}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icon icon={CheckCircle2} size="sm" />
            Verified couple signal
          </div>
          <p className="text-[11px] text-muted-foreground">
            Winners and shortlists are promoted from admin nominations tied to live vendor storefronts.
          </p>
        </div>
        <div className="space-y-1.5 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icon icon={ShieldCheck} size="sm" />
            Cultural authenticity
          </div>
          <p className="text-[11px] text-muted-foreground">
            Recognizing expertise across Poruwa, Church, Hindu, and Nikah traditions.
          </p>
        </div>
        <div className="space-y-1.5 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icon icon={Sparkles} size="sm" />
            Service excellence
          </div>
          <p className="text-[11px] text-muted-foreground">
            Editorial status flows from Nominated → Shortlisted → Winner in Admin Settings.
          </p>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading awards…</p> : null}

      {!loading && winners.length === 0 && shortlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No published winners or shortlist for {selectedYear} yet.
        </div>
      ) : null}

      {winners.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold">Winners</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {winners.map((award) => (
              <AwardCard key={award.id} award={award} />
            ))}
          </div>
        </section>
      ) : null}

      {shortlist.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold">Shortlist</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {shortlist.map((award) => (
              <AwardCard key={award.id} award={award} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-3xl border bg-card p-8 text-center">
        <h3 className="mb-2 font-serif text-2xl font-semibold">Vendors: get nominated</h3>
        <p className="mx-auto mb-4 max-w-xl text-sm text-muted-foreground">
          Keep your storefront complete and verified. Ceylon Ops nominates standout partners each year.
        </p>
        <Button asChild shape="pill">
          <Link href="/for-vendors" className="inline-flex items-center gap-1.5">
            List your business <Icon icon={ArrowRight} size="xs" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AwardCard({ award }: { award: PublicAward }) {
  return (
    <Link
      href={`/vendors/${award.vendor.slug}`}
      className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:border-primary/40"
    >
      <div
        className="h-40 bg-cover bg-center"
        style={{
          backgroundImage: `url(${award.vendor.coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"})`,
        }}
      />
      <div className="space-y-1 p-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {CATEGORY_LABELS[award.category] ?? award.category} · {award.status}
        </p>
        <h3 className="font-serif text-xl font-semibold group-hover:text-primary">{award.vendor.name}</h3>
        <p className="text-xs text-muted-foreground">
          {[award.vendor.city, award.vendor.district].filter(Boolean).join(", ")}
          {award.vendor.ratingAvg != null
            ? ` · ${award.vendor.ratingAvg.toFixed(1)}★ (${award.vendor.reviewCount ?? 0})`
            : null}
        </p>
        {award.notes ? <p className="pt-1 text-sm text-muted-foreground">{award.notes}</p> : null}
      </div>
    </Link>
  );
}
