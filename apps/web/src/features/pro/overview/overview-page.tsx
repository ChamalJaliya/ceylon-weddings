"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Briefcase, MessageCircle, ShieldCheck, Sparkles, Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Inquiry, Vendor, VendorSubscription } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CompletenessChecklist } from "@ceylonweddings/ui/domain/creator-form";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { StatCard } from "@ceylonweddings/ui/domain/stat-card";
import { DashboardStats } from "@ceylonweddings/ui/domain/dashboard-layout";
import { MediaFrame } from "@ceylonweddings/ui/domain/media-frame";
import { BillingAlertBanner, resolveBillingAlertBanner } from "@ceylonweddings/ui/domain/billing-alert-banner";
import { SubscriptionStatusBanner } from "@ceylonweddings/ui/domain/subscription-status-banner";
import { Link, useRouter } from "@/i18n/navigation";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { BulletPreviewRow, PreviewRow, PreviewRowList } from "@ceylonweddings/ui/domain/preview-row";

export default function ProHomePage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [leads, setLeads] = useState<(Inquiry & { wedding: { partnerOneName: string; partnerTwoName: string } })[]>([]);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.vendors.mine(), api.vendors.leads()])
      .then(([mine, inbox]) => {
        setVendor(mine);
        setLeads(inbox);
        return api.subscription
          .vendor(mine.id)
          .then((sub) => setSubscription(sub))
          .catch(() => null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }
  if (!vendor) return <CenteredLoader label="Loading…" />;

  const newLeads = leads.filter((lead) => lead.status === "NEW").length;
  const completeness = vendor.completeness;
  const publishedOffers = (vendor.packages ?? []).filter((pkg) => pkg.status === "PUBLISHED").length;
  const cover = vendor.photoUrl ?? vendor.photos?.[0];
  const billingAlert = subscription
    ? resolveBillingAlertBanner({
        billingAlert: subscription.billingAlert,
        daysRemaining: subscription.daysRemaining,
        planName: subscription.plan?.name,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
    : null;

  return (
    <div className="cw-stack">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-secondary/30 shadow-sm">
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1.2fr)_14rem] md:items-stretch md:p-6">
          <div className="grid gap-4 self-center">
            <PageHeader
              icon={Store}
              kicker="Vendor workspace"
              title={vendor.name}
              description="Polish your storefront until couples feel your work before they message."
              actions={
                <Button asChild>
                  <Link href="/pro/storefront">
                    Open studio
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              }
            />
            {completeness ? (
              <CompletenessChecklist
                score={completeness.score}
                total={completeness.total}
                missing={completeness.missing}
                ready={completeness.ready}
              />
            ) : null}
          </div>
          <div className="relative hidden overflow-hidden rounded-2xl md:block">
            <MediaFrame src={cover} alt={vendor.name} aspect="aspect-[4/5]" className="h-full rounded-2xl" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent p-4 text-hero-foreground">
              <p className="text-label tracking-eyebrow uppercase opacity-80">Live listing</p>
              <p className="font-serif text-lg leading-tight">/vendors/{vendor.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {billingAlert ? <BillingAlertBanner model={billingAlert} onCta={() => router.push("/pro/billing")} /> : null}

      {subscription && (
        <SubscriptionStatusBanner
          status={subscription.status}
          daysRemaining={subscription.daysRemaining}
          trialEndsAt={subscription.trialEndsAt}
          currentPeriodEnd={subscription.currentPeriodEnd}
          planName={subscription.plan?.name}
          onUpgradeClick={() => {
            window.location.href = "/pro/billing";
          }}
        />
      )}

      <DashboardStats>
        <StatCard icon={Briefcase} label="New leads" value={String(newLeads)} hint="Awaiting reply" tone="warning" />
        <StatCard
          icon={Sparkles}
          label="Published offers"
          value={String(publishedOffers)}
          hint={`${vendor.packages?.length ?? 0} total packages`}
          tone="love"
        />
        <StatCard
          icon={MessageCircle}
          label="WhatsApp"
          value={vendor.whatsapp ?? "—"}
          hint={vendor.whatsapp ? "Connected" : "Add in Presence"}
          tone="info"
        />
        <StatCard
          icon={ShieldCheck}
          label="Listing"
          value={vendor.verified ? "Verified" : "Unverified"}
          hint={vendor.featured ? "Featured pick" : "Trust mark"}
          tone={vendor.verified ? "success" : "default"}
        />
      </DashboardStats>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent leads"
          icon={Briefcase}
          delay={1}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/pro/leads">View all</Link>
            </Button>
          }
        >
          <PreviewRowList
            empty={leads.length === 0}
            emptyTitle="Recent leads"
            emptyDescription="No inquiries yet — refine offers and publish."
          >
            {leads.slice(0, 4).map((lead) => (
              <PreviewRow
                key={lead.id}
                title={`${lead.wedding.partnerOneName} & ${lead.wedding.partnerTwoName}`}
                description={lead.message}
              />
            ))}
          </PreviewRowList>
        </SectionCard>

        <SectionCard
          title="Next studio steps"
          icon={Sparkles}
          delay={2}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/pro/storefront">Continue</Link>
            </Button>
          }
        >
          <ul className="grid gap-2">
            {(completeness?.missing.length
              ? completeness.missing
              : ["Preview your live storefront", "Check WhatsApp number", "Publish at least one package"]
            )
              .slice(0, 4)
              .map((item) => (
                <BulletPreviewRow key={item}>{item.replaceAll("_", " ")}</BulletPreviewRow>
              ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
