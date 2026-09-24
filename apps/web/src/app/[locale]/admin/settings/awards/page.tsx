"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AwardNomination, AwardNominationStatus, Vendor } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

const STATUSES: AwardNominationStatus[] = ["NOMINATED", "SHORTLISTED", "WINNER", "REJECTED"];

export default function AdminAwardsPage() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [awards, setAwards] = useState<AwardNomination[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [filterYear, setFilterYear] = useState(year);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextAwards, nextVendors] = await Promise.all([api.admin.awards(), api.admin.vendors()]);
      setAwards(nextAwards);
      setVendors(nextVendors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
          >
            <option value="">Select vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name} · {vendor.category}
              </option>
            ))}
          </select>
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
          <input
            type="number"
            className="w-24 rounded-lg border border-border/70 bg-background px-2 py-1 text-sm"
            value={filterYear}
            onChange={(e) => setFilterYear(Number.parseInt(e.target.value, 10) || year)}
          />
        </label>
      </SectionCard>

      <SectionCard title={`${filterYear} nominations`} icon={Trophy}>
        <ul className="grid gap-2 text-sm">
          {filtered.map((award) => (
            <li
              key={award.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
            >
              <div>
                <p className="font-medium">{award.vendorName ?? award.vendorId}</p>
                <p className="text-xs text-muted-foreground">
                  {award.category} · {award.year}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge intent="outline">{award.status}</Badge>
                <select
                  className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs"
                  value={award.status}
                  onChange={async (e) => {
                    await api.admin.upsertAward({
                      vendorId: award.vendorId,
                      year: award.year,
                      category: award.category,
                      status: e.target.value as AwardNominationStatus,
                      notes: award.notes,
                    });
                    await load();
                  }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="text-xs text-muted-foreground">No nominations for this year yet.</li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}
