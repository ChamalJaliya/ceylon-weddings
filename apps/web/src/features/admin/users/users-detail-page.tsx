"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminUser, AuditLog } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AuditTimeline } from "@ceylonweddings/ui/domain/audit-timeline";
import { Link } from "@/i18n/navigation";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [vendor, setVendor] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [weddings, setWeddings] = useState<
    Array<{ id: string; slug: string; partnerOneName: string; partnerTwoName: string }>
  >([]);
  const [sessions, setSessions] = useState<Array<{ id: string; createdAt: string; expiresAt: string }>>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const detail = await api.admin.user(params.id);
      setUser(detail.user);
      setVendor(detail.vendor);
      setWeddings(detail.weddings);
      setSessions(detail.sessions);
      setAudit(detail.audit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/users">Back</Link>
      </FormStatus>
    );
  }

  if (!user) return <CenteredLoader label="Loading…" />;

  return (
    <div className="grid gap-8">
      <PlanningHero
        icon={Users}
        kicker="Admin · User"
        title={user.name}
        description={user.email}
        actions={
          <Button asChild variant="outline" size="sm" shape="pill" className={heroButtonClass}>
            <Link href="/admin/users">All users</Link>
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-paper/10 px-3 py-1">
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </span>
          <span
            className={
              user.status === "SUSPENDED"
                ? "rounded-full bg-love px-3 py-1 text-love-foreground"
                : "rounded-full bg-[color:var(--cw-gold-300)]/20 px-3 py-1 text-[color:var(--cw-gold-300)]"
            }
          >
            {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
          </span>
        </div>
      </PlanningHero>
      {message ? <FormStatus>{message}</FormStatus> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Account" icon={Users}>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const next = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
                await api.admin.patchUser(user.id, { status: next });
                setMessage(next === "SUSPENDED" ? "User suspended" : "User reactivated");
                await load();
              }}
            >
              {user.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const result = await api.admin.revokeSessions(user.id);
                setMessage(`Revoked ${result.deleted} sessions`);
                await load();
              }}
            >
              Revoke sessions
            </Button>
            {user.role !== "ADMIN" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const result = await api.admin.impersonate(user.id);
                  setMessage(`Impersonation audited for ${result.target.email} (session switch is Wave E UI)`);
                }}
              >
                Log impersonation
              </Button>
            ) : null}
          </div>
          {vendor ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Vendor: <Link href={`/admin/vendors/${vendor.id}`}>{vendor.name}</Link>
            </p>
          ) : null}
          {weddings.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-sm">
              {weddings.map((wedding) => (
                <li key={wedding.id}>
                  <Link href={`/admin/weddings/${wedding.id}`}>
                    {wedding.partnerOneName} & {wedding.partnerTwoName} ({wedding.slug})
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{sessions.length} recent sessions listed.</p>
        </SectionCard>
        <SectionCard title="Audit" icon={Users}>
          <AuditTimeline items={audit} />
        </SectionCard>
      </div>
    </div>
  );
}
