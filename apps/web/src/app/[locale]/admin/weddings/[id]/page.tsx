"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminWeddingSummary } from "@ceylonweddings/contracts";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

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

  if (!wedding) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={CalendarDays}
        kicker="Support"
        title={`${wedding.partnerOneName} & ${wedding.partnerTwoName}`}
        description={wedding.slug}
      />
      <SectionCard title="Snapshot" icon={CalendarDays}>
        <ul className="grid gap-2 text-sm">
          <li>City: {wedding.city ?? "—"}</li>
          <li>District: {wedding.district ?? "—"}</li>
          <li>Date: {wedding.date ? new Date(wedding.date).toLocaleDateString() : "—"}</li>
          <li>Booked vendors: {wedding.bookedVendorCount}</li>
          <li>Guest households: {wedding.guestHouseholdCount}</li>
          <li>Members: {wedding.memberEmails.join(", ") || "—"}</li>
          <li>
            Guest site: <Link href={`/w/${wedding.slug}`}>/w/{wedding.slug}</Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
