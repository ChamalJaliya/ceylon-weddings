"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminListingPreview } from "@ceylonweddings/ui/domain/team-vendor";
import { Link } from "../../../../../i18n/navigation";
import { CATEGORY_LABELS } from "../../../../../lib/labels";

export default function AdminVerifyQueuePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setVendors(await api.admin.vendors({ queue: "verify" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
      <PageHeader
        icon={ShieldAlert}
        kicker="Queue"
        title="Verify vendors"
        description="Approve with notes or reject incomplete listings."
      />
      <SectionCard title="Pending" icon={ShieldAlert}>
        {vendors.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Queue clear" description="No vendors waiting for verification." />
        ) : (
          <div className="grid gap-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="grid gap-3 rounded-xl border border-border/70 p-4">
                <AdminListingPreview
                  name={vendor.name}
                  category={CATEGORY_LABELS[vendor.category] ?? vendor.category}
                  location={vendor.city}
                  photoUrl={vendor.photoUrl}
                  photos={vendor.photos}
                  verified={vendor.verified}
                  featured={vendor.featured}
                  ready={presentationGateFailures(vendor).length === 0}
                />
                <Textarea
                  placeholder="Rejection / approval note"
                  value={notes[vendor.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [vendor.id]: event.target.value }))}
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
