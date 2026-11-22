"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { AdminQueueVendorCard, AdminQueueVendorList } from "@ceylonweddings/ui/domain/admin-queue-vendor-card";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS } from "@/lib/labels";

export default function AdminVerifyQueuePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setVendors(await api.admin.vendors({ queue: "verify" }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, approve: boolean) {
    await api.admin.patchVendor(id, {
      moderationStatus: approve ? "APPROVED" : "REJECTED",
      verified: approve,
      moderationNote: notes[id] ?? null,
    });
    await load();
  }

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PlanningHero
        icon={ShieldAlert}
        kicker="Queue"
        title="Verify vendors"
        description="Approve with notes or reject incomplete listings."
      >
        <div>
          <p
            className={
              vendors.length
                ? "font-serif text-5xl leading-none text-[color:var(--cw-gold-300)]"
                : "font-serif text-5xl leading-none"
            }
          >
            {vendors.length}
          </p>
          <p className="mt-1 text-sm text-paper/70">{vendors.length ? "waiting for review" : "Queue clear"}</p>
        </div>
      </PlanningHero>
      <SectionCard title="Pending" icon={ShieldAlert}>
        {loading ? (
          <CenteredLoader label="Loading queue" />
        ) : vendors.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Queue clear" description="No vendors waiting for verification." />
        ) : (
          <AdminQueueVendorList>
            {vendors.map((vendor) => (
              <AdminQueueVendorCard
                key={vendor.id}
                name={vendor.name}
                category={CATEGORY_LABELS[vendor.category] ?? vendor.category}
                location={vendor.city}
                photoUrl={vendor.photoUrl}
                photos={vendor.photos}
                verified={vendor.verified}
                featured={vendor.featured}
                ready={presentationGateFailures(vendor).length === 0}
                actions={
                  <>
                    <Badge>{vendor.moderationStatus ?? "PENDING"}</Badge>
                    <Button size="sm" onClick={() => void decide(vendor.id, true)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void decide(vendor.id, false)}>
                      Reject
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/vendors/${vendor.id}`}>Detail</Link>
                    </Button>
                  </>
                }
              >
                <Textarea
                  placeholder="Rejection / approval note"
                  value={notes[vendor.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [vendor.id]: event.target.value }))}
                  rows={2}
                />
              </AdminQueueVendorCard>
            ))}
          </AdminQueueVendorList>
        )}
      </SectionCard>
    </div>
  );
}
