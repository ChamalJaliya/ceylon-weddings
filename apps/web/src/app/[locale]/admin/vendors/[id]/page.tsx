"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Sparkles, Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AuditLog, Vendor, VendorSubscription } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AuditTimeline } from "@ceylonweddings/ui/domain/audit-timeline";
import { Link } from "../../../../../i18n/navigation";

export default function AdminVendorDetailPage() {
  const params = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [gateFailures, setGateFailures] = useState<string[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const [detail, sub] = await Promise.all([
        api.admin.vendor(params.id),
        api.admin.vendorSubscription(params.id).catch(() => null),
      ]);
      setVendor(detail.vendor);
      setGateFailures(detail.gateFailures);
      setAudit(detail.audit);
      setNote(detail.vendor.moderationNote ?? "");
      setSubscription(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function patch(body: Parameters<typeof api.admin.patchVendor>[1]) {
    try {
      setMessage(null);
      const updated = await api.admin.patchVendor(params.id, body);
      setVendor(updated);
      setMessage("Saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/vendors">Back</Link>
      </FormStatus>
    );
  }

  if (!vendor) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Store}
        kicker="Admin"
        title={vendor.name}
        description={`${vendor.city} · ${vendor.slug}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/vendors/${vendor.slug}`}>Public preview</Link>
          </Button>
        }
      />
      {message ? <FormStatus>{message}</FormStatus> : null}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Trust actions" icon={Store}>
          <div className="mb-3 flex flex-wrap gap-2">
            {vendor.verified ? <Badge intent="success">Verified</Badge> : <Badge>Unverified</Badge>}
            {vendor.featured ? <Badge intent="love">Featured</Badge> : null}
            {vendor.moderationStatus ? <Badge>{vendor.moderationStatus}</Badge> : null}
          </div>
          <div className="mb-4 grid gap-2">
            <label className="text-sm font-medium">Moderation note</label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
            <Button size="sm" variant="outline" onClick={() => void patch({ moderationNote: note })}>
              Save note
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void patch({ verified: !vendor.verified })}>
              {vendor.verified ? "Unverify" : "Verify"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void patch({ featured: !vendor.featured })}
              disabled={!vendor.featured && gateFailures.length > 0}
            >
              {vendor.featured ? "Remove Pick" : "Make Pick"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void patch({ moderationStatus: "APPROVED", moderationNote: note })}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void patch({ moderationStatus: "REJECTED", moderationNote: note })}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void patch({ moderationStatus: "HIDDEN", moderationNote: note })}
            >
              Hide listing
            </Button>
          </div>
          {gateFailures.length > 0 ? (
            <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
              {gateFailures.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Presentation gate passed.</p>
          )}
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard title="Subscription Controls" icon={Shield}>
            {subscription ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Status</span>
                  <Badge
                    intent={
                      subscription.status === "ACTIVE"
                        ? "success"
                        : subscription.status === "TRIAL"
                        ? "info"
                        : subscription.status === "COMPED"
                        ? "love"
                        : "danger"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Days remaining</span>
                  <span className="font-semibold text-foreground">{subscription.daysRemaining} days</span>
                </div>
                {subscription.trialEndsAt && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Trial Ends</span>
                    <span>{new Date(subscription.trialEndsAt).toLocaleDateString()}</span>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Period End</span>
                    <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="border-t pt-3 grid gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Admin Overrides</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const newDate = new Date();
                        newDate.setDate(newDate.getDate() + 30);
                        await api.admin.overrideTrial(params.id, { trialEndsAt: newDate.toISOString() });
                        setMessage("Trial extended by 30 days");
                        await load();
                      }}
                    >
                      +30d Trial
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await api.admin.grantComped(params.id, {});
                        setMessage("Granted complimentary partner access");
                        await load();
                      }}
                    >
                      Grant Comped
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const plans = await api.subscription.plans();
                        const monthly = plans.find((p) => p.interval === "MONTHLY") || plans[0];
                        if (monthly) {
                          await api.admin.activatePaid(params.id, { planId: monthly.id, interval: "MONTHLY" });
                          setMessage("Activated Monthly Paid Plan");
                          await load();
                        }
                      }}
                    >
                      Activate Monthly
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await api.admin.suspendSubscription(params.id);
                        setMessage("Subscription suspended");
                        await load();
                      }}
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading subscription details…</p>
            )}
          </SectionCard>

          <SectionCard title="Audit Log" icon={Sparkles}>
            <AuditTimeline items={audit} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
