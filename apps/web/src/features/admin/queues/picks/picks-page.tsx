"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { presentationGateFailures, type Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { AdminQueueVendorCard, AdminQueueVendorList } from "@ceylonweddings/ui/domain/admin-queue-vendor-card";
import { AdminQueue, AdminQueueChip } from "@ceylonweddings/ui/domain/admin-queue";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS } from "@/lib/labels";

export default function AdminPicksQueuePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<"all" | "ready" | "fail">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setVendors(await api.admin.vendors({ queue: "picks" }));
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

  const ready = vendors.filter((vendor) => presentationGateFailures(vendor).length === 0);
  const failing = vendors.filter((vendor) => presentationGateFailures(vendor).length > 0);
  const visible = filter === "ready" ? ready : filter === "fail" ? failing : vendors;
  const emptyMode = getListEmptyMode({
    sourceCount: vendors.length,
    filteredCount: visible.length,
  });
  const chrome = showListChrome(emptyMode, loading);

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
      {chrome ? (
        <AdminQueue>
          <AdminQueueChip
            label="All"
            count={vendors.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <AdminQueueChip
            label="Ready"
            count={ready.length}
            active={filter === "ready"}
            onClick={() => setFilter("ready")}
          />
          <AdminQueueChip
            label="Gate fail"
            count={failing.length}
            active={filter === "fail"}
            onClick={() => setFilter("fail")}
          />
        </AdminQueue>
      ) : null}
      <SectionCard title="Candidates" icon={Sparkles}>
        {loading ? (
          <CenteredLoader label="Loading picks" />
        ) : emptyMode === "empty" ? (
          <EmptyState icon={Sparkles} title="No candidates" description="Nothing in this filter." />
        ) : emptyMode === "no-results" ? (
          <EmptyState
            kind="no-results"
            icon={Sparkles}
            title="No candidates"
            description="Nothing in this filter."
            onClearFilters={() => setFilter("all")}
          />
        ) : (
          <AdminQueueVendorList>
            {visible.map((vendor) => {
              const failures = presentationGateFailures(vendor);
              return (
                <AdminQueueVendorCard
                  key={vendor.id}
                  layout="split"
                  name={vendor.name}
                  category={CATEGORY_LABELS[vendor.category] ?? vendor.category}
                  location={vendor.city}
                  photoUrl={vendor.photoUrl}
                  photos={vendor.photos}
                  verified={vendor.verified}
                  featured={vendor.featured}
                  ready={failures.length === 0}
                  failures={failures}
                  actions={
                    <>
                      {failures.length === 0 ? <Badge intent="success">Gate ready</Badge> : null}
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
                    </>
                  }
                />
              );
            })}
          </AdminQueueVendorList>
        )}
      </SectionCard>
    </div>
  );
}
