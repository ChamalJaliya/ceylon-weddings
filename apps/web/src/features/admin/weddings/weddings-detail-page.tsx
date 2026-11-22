"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminWeddingSummary } from "@ceylonweddings/contracts";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { Button } from "@ceylonweddings/ui/components/button";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "@/i18n/navigation";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";

export default function AdminWeddingDetailPage() {
  const params = useParams<{ id: string }>();
  const [wedding, setWedding] = useState<AdminWeddingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .wedding(params.id)
      .then(setWedding)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/weddings">Back</Link>
      </FormStatus>
    );
  }

  if (!wedding) return <CenteredLoader label="Loading…" />;

  return (
    <div className="grid min-w-0 gap-6">
      <PlanningHero
        icon={CalendarDays}
        kicker="Support · Wedding"
        title={`${wedding.partnerOneName} & ${wedding.partnerTwoName}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {[...new Set([wedding.city, wedding.district].filter(Boolean))].join(", ") || "No location yet"}
            <span className="rounded-full bg-paper/10 px-2.5 py-0.5 font-mono text-xs">/w/{wedding.slug}</span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm" shape="pill" className={heroButtonClass}>
              <Link href="/admin/weddings">All weddings</Link>
            </Button>
            <Button asChild size="sm" shape="pill" className="bg-paper text-ink hover:bg-paper/90">
              <Link href={`/w/${wedding.slug}`}>Guest site</Link>
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-paper/60">Date</p>
            <p className="font-serif text-2xl">
              {wedding.date
                ? new Date(wedding.date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Vendors booked</p>
            <p className="font-serif text-2xl">{wedding.bookedVendorCount}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Guest households</p>
            <p className="font-serif text-2xl">{wedding.guestHouseholdCount}</p>
          </div>
        </div>
      </PlanningHero>
      <SectionCard title="Members" icon={CalendarDays}>
        {wedding.memberEmails.length ? (
          <ul className="grid gap-2">
            {wedding.memberEmails.map((email) => (
              <li key={email} className="flex items-center gap-3 text-sm">
                <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-medium">
                  {email.charAt(0).toUpperCase()}
                </span>
                <a href={`mailto:${email}`} className="hover:text-primary">
                  {email}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No members.</p>
        )}
      </SectionCard>
    </div>
  );
}
