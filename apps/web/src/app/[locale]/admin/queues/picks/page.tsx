"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminListingPreview } from "@ceylonweddings/ui/domain/team-vendor";
import { AdminQueue, AdminQueueChip } from "@ceylonweddings/ui/domain/admin-queue";
import { Link } from "../../../../../i18n/navigation";
import { CATEGORY_LABELS } from "../../../../../lib/labels";

export default function AdminPicksQueuePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<"all" | "ready" | "fail">("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setVendors(await api.admin.vendors({ queue: "picks" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ready = vendors.filter((vendor) => presentationGateFailures(vendor).length === 0);
  const failing = vendors.filter((vendor) => presentationGateFailures(vendor).length > 0);
  const visible =
    filter === "ready" ? ready : filter === "fail" ? failing : vendors;

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
        icon={Sparkles}
        kicker="Queue"
        title="Ceylon Picks"
        description="Feature only gate-ready verified listings."
      />
      <AdminQueue>
        <AdminQueueChip label="All" count={vendors.length} active={filter === "all"} onClick={() => setFilter("all")} />
        <AdminQueueChip label="Ready" count={ready.length} active={filter === "ready"} onClick={() => setFilter("ready")} />
        <AdminQueueChip label="Gate fail" count={failing.length} active={filter === "fail"} onClick={() => setFilter("fail")} />
      </AdminQueue>
      <SectionCard title="Candidates" icon={Sparkles}>
        {visible.length === 0 ? (
          <EmptyState icon={Sparkles} title="No candidates" description="Nothing in this filter." />
        ) : (
          <div className="grid gap-4">
            {visible.map((vendor) => {
              const failures = presentationGateFailures(vendor);
              return (
                <div key={vendor.id} className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="grid gap-2">
                    <AdminListingPreview
                      name={vendor.name}
                      category={CATEGORY_LABELS[vendor.category] ?? vendor.category}
                      location={vendor.city}
                      photoUrl={vendor.photoUrl}
                      photos={vendor.photos}
                      verified={vendor.verified}
                      featured={vendor.featured}
                      ready={failures.length === 0}
                    />
                    {failures.length > 0 ? (
                      <ul className="text-xs text-muted-foreground">
                        {failures.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <Badge intent="success">Gate ready</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={failures.length > 0}
                      onClick={async () => {
                        await api.admin.patchVendor(vendor.id, { featured: true });
                        await load();
                      }}
                    >
                      Make Pick
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/vendors/${vendor.id}`}>Detail</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
