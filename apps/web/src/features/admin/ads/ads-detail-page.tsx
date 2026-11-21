"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Link2, Megaphone, Trash2 } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  promotionCompleteness,
  type Promotion,
  type UpsertPromotionBody,
  type VendorCategory,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { CreatorSectionNav, FormGroup, StickyActionBar, StudioShell } from "@ceylonweddings/ui/domain/creator-form";
import {
  emptyPromotionDraft,
  nextPromotionSection,
  PromotionCreativeFields,
  PromotionPreview,
  PromotionProgress,
  PromotionReview,
  PromotionScheduleFields,
  promotionSections,
  PromotionStatusBadge,
  PromotionTargetingFields,
  type AdsPromotionDraft,
  type PromotionSectionId,
} from "@ceylonweddings/ui/domain/ads-studio";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { Link, useRouter } from "@/i18n/navigation";
import { CATEGORY_LABELS, localizedText } from "@/lib/labels";
import { uploadImage } from "@/lib/upload-image";

export default function AdminAdsStudioPage() {
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const isNew = params.id === "new";
  const [section, setSection] = useState<PromotionSectionId>("creative");
  const [draft, setDraft] = useState<AdsPromotionDraft>(emptyPromotionDraft());
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(
    Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  );

  useEffect(() => {
    api.admin.vendors().then((rows) => setVendors(rows.map((row) => ({ id: row.id, name: row.name }))));
  }, []);

  useEffect(() => {
    void api
      .vendorTypes()
      .then((types) =>
        setCategoryOptions(
          types.map((type) => ({
            value: type.slug,
            label: localizedText(type.label, locale) || CATEGORY_LABELS[type.slug] || type.slug,
          })),
        ),
      )
      .catch(() => undefined);
  }, [locale]);

  useEffect(() => {
    if (isNew) return;
    api.admin
      .promotion(params.id)
      .then((promo: Promotion) => {
        setDraft({
          name: promo.name,
          status: promo.status,
          headline: promo.headline,
          subheadline: promo.subheadline,
          body: promo.body,
          ctaLabel: promo.ctaLabel,
          ctaHref: promo.ctaHref,
          coverUrl: promo.coverUrl,
          secondaryUrl: promo.secondaryUrl,
          logoUrl: promo.logoUrl,
          accentColor: promo.accentColor,
          overlayTone: promo.overlayTone,
          layout: promo.layout,
          badgeLabel: promo.badgeLabel,
          slots: promo.slots,
          cities: promo.cities,
          categories: promo.categories,
          locales: promo.locales,
          startsAt: promo.startsAt,
          endsAt: promo.endsAt,
          priority: promo.priority,
          vendorId: promo.vendorId,
          vendorName: promo.vendorName,
          source: promo.source,
          notes: promo.notes,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [isNew, params.id]);

  const completeness = useMemo(() => promotionCompleteness(draft), [draft]);
  const sections = promotionSections(draft, completeness);
  const prev = nextPromotionSection(section, -1);
  const next = nextPromotionSection(section, 1);

  function patch(change: Partial<AdsPromotionDraft>) {
    setDraft((current) => ({ ...current, ...change }));
  }

  function toBody(): UpsertPromotionBody {
    return {
      name: draft.name,
      status: draft.status,
      headline: draft.headline,
      subheadline: draft.subheadline,
      body: draft.body,
      ctaLabel: draft.ctaLabel,
      ctaHref: draft.ctaHref,
      coverUrl: draft.coverUrl,
      secondaryUrl: draft.secondaryUrl,
      logoUrl: draft.logoUrl,
      accentColor: draft.accentColor,
      overlayTone: draft.overlayTone === "light" ? "light" : "dark",
      layout: draft.layout,
      badgeLabel: draft.badgeLabel,
      slots: draft.slots,
      cities: draft.cities,
      categories: draft.categories as VendorCategory[],
      locales: draft.locales,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      priority: draft.priority,
      vendorId: draft.vendorId,
      source: draft.source,
      notes: draft.notes,
    };
  }

  async function save(status?: AdsPromotionDraft["status"]) {
    try {
      setSaving(true);
      setError(null);
      const body = { ...toBody(), status: status ?? draft.status };
      if (isNew) {
        const created = await api.admin.createPromotion(body);
        toast.success(body.status === "ACTIVE" ? "Campaign is live" : "Campaign created");
        router.replace(`/admin/ads/${created.id}`);
      } else {
        await api.admin.updatePromotion(params.id, body);
        setDraft((current) => ({ ...current, status: body.status }));
        toast.success(body.status === "ACTIVE" ? "Campaign is live" : "Saved");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: `Delete “${draft.name || "this campaign"}”?`,
      description: "It stops showing immediately and its performance history is lost.",
      confirmLabel: "Delete campaign",
      destructive: true,
      onConfirm: () => api.admin.deletePromotion(params.id),
    });
    if (!ok) return;
    toast.success("Campaign deleted");
    router.push("/admin/ads");
  }

  const categoryLabel = (value: string) => categoryOptions.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Megaphone}
        kicker="Ads studio"
        title={isNew ? "New campaign" : draft.name || "Edit campaign"}
        description="Design the ad, choose where it runs, and see it live as you go."
        actions={
          <div className="flex items-center gap-2">
            {!isNew ? <PromotionStatusBadge status={draft.status} /> : null}
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/ads">
                <ArrowLeft className="size-4" aria-hidden />
                All campaigns
              </Link>
            </Button>
            {!isNew ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => void remove()}
                aria-label="Delete campaign"
              >
                <Trash2 className="size-4 text-destructive" aria-hidden />
              </Button>
            ) : null}
          </div>
        }
      />
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      <StudioShell
        defaultPreviewOpen
        nav={
          <CreatorSectionNav
            sections={sections}
            active={section}
            onSelect={(id) => setSection(id as PromotionSectionId)}
          />
        }
        previewLabel="Live preview"
        previewTitle={draft.name || "Campaign preview"}
        previewHint={`${completeness.score}/${completeness.total}`}
        previewThumb={draft.coverUrl}
        preview={<PromotionPreview promo={draft} />}
      >
        {section === "creative" ? (
          <PromotionCreativeFields
            value={draft}
            onChange={patch}
            onUpload={(file) => uploadImage(file, (body) => api.admin.onboardingAssetPresign(body))}
          />
        ) : null}
        {section === "targeting" ? (
          <PromotionTargetingFields value={draft} onChange={patch} categoryOptions={categoryOptions}>
            <FormGroup
              title="Linked vendor"
              description="Optional — credits the vendor and shows their name on the ad."
              icon={Link2}
            >
              <SimpleSelect
                value={draft.vendorId ?? "__none__"}
                onValueChange={(vendorId) => {
                  if (vendorId === "__none__") {
                    patch({ vendorId: null, vendorName: null });
                    return;
                  }
                  const vendor = vendors.find((item) => item.id === vendorId);
                  patch({ vendorId, vendorName: vendor?.name ?? null });
                }}
                options={[
                  { value: "__none__", label: "Platform / no vendor" },
                  ...vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
                ]}
              />
            </FormGroup>
          </PromotionTargetingFields>
        ) : null}
        {section === "schedule" ? <PromotionScheduleFields value={draft} onChange={patch} /> : null}
        {section === "publish" ? (
          <PromotionReview
            promo={draft}
            completeness={completeness}
            onJump={setSection}
            categoryLabel={categoryLabel}
          />
        ) : null}
        <StickyActionBar>
          <PromotionProgress completeness={completeness} status={draft.status} />
          {prev ? (
            <Button variant="ghost" onClick={() => setSection(prev)}>
              Back
            </Button>
          ) : null}
          <Button variant="outline" disabled={saving} onClick={() => void save("DRAFT")}>
            Save draft
          </Button>
          {next ? (
            <Button onClick={() => setSection(next)}>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button disabled={saving || !completeness.ready} onClick={() => void save("ACTIVE")}>
              Publish live
            </Button>
          )}
        </StickyActionBar>
      </StudioShell>
    </div>
  );
}
