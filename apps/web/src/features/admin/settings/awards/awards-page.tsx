"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AwardNomination, AwardNominationStatus, Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { Link } from "@/i18n/navigation";

const STATUSES: AwardNominationStatus[] = ["NOMINATED", "SHORTLISTED", "WINNER", "REJECTED"];

export default function AdminAwardsPage() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [awards, setAwards] = useState<AwardNomination[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [filterYear, setFilterYear] = useState(year);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [nextAwards, nextVendors] = await Promise.all([api.admin.awards(), api.admin.vendors()]);
      setAwards(nextAwards);
      setVendors(nextVendors);
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

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  const filtered = awards.filter((award) => award.year === filterYear);

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Trophy}
        kicker="Settings"
        title="Best of Ceylon awards"
        description="Nominate vendors and promote shortlist/winners for the public awards page."
      />

      <SectionCard title="Nominate" icon={Trophy}>
        <div className="mb-3 flex flex-wrap gap-2">
          <SimpleSelect
            value={vendorId}
            onValueChange={setVendorId}
            placeholder="Select vendor"
            aria-label="Select vendor"
            className="min-w-[16rem]"
            options={vendors.map((vendor) => ({
              value: vendor.id,
              label: `${vendor.name} · ${vendor.category}`,
            }))}
          />
          <Button
            size="sm"
            disabled={!vendorId}
            onClick={async () => {
              const vendor = vendors.find((item) => item.id === vendorId);
              if (!vendor) return;
              await api.admin.upsertAward({
                vendorId: vendor.id,
                year: filterYear,
                category: vendor.category,
                status: "NOMINATED",
              });
              setVendorId("");
              await load();
            }}
          >
            Nominate
          </Button>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          Year
          <Input
            type="number"
            className="w-24"
            value={filterYear}
            onChange={(e) => setFilterYear(Number.parseInt(e.target.value, 10) || year)}
          />
        </label>
      </SectionCard>

      <SectionCard title={`${filterYear} nominations`} icon={Trophy}>
        {loading ? (
          <CenteredLoader label="Loading nominations" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No nominations for this year yet"
            description="Nominate a vendor above to get started."
          />
        ) : (
          <SettingsList>
            {filtered.map((award) => (
              <SettingsListRow
                key={award.id}
                title={award.vendorName ?? award.vendorId}
                description={`${award.category} · ${award.year}`}
                actions={
                  <>
                    <Badge intent="outline">{award.status}</Badge>
                    <SimpleSelect
                      value={award.status}
                      onValueChange={async (status) => {
                        await api.admin.upsertAward({
                          vendorId: award.vendorId,
                          year: award.year,
                          category: award.category,
                          status: status as AwardNominationStatus,
                          notes: award.notes,
                        });
                        await load();
                      }}
                      aria-label={`Status for ${award.vendorName ?? award.vendorId}`}
                      className="min-w-[9rem]"
                      options={STATUSES.map((status) => ({ value: status, label: status }))}
                    />
                  </>
                }
              />
            ))}
          </SettingsList>
        )}
      </SectionCard>
    </div>
  );
}
