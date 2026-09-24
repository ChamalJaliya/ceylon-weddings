"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  promotionCompleteness,
  type Promotion,
  type UpsertPromotionBody,
  type VendorCategory,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import {
  CompletenessChecklist,
  CreatorSectionNav,
  StickyActionBar,
  StudioShell,
} from "@ceylonweddings/ui/domain/creator-form";
import {
  emptyPromotionDraft,
  PromotionCreativeFields,
  PromotionPreview,
  PromotionScheduleFields,
  PromotionTargetingFields,
  type AdsPromotionDraft,
} from "@ceylonweddings/ui/domain/ads-studio";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { Link, useRouter } from "../../../../../i18n/navigation";
import { CATEGORY_LABELS, localizedText } from "../../../../../lib/labels";

type Section = "creative" | "targeting" | "schedule" | "publish";

export default function AdminAdsStudioPage() {
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [section, setSection] = useState<Section>("creative");
  const [draft, setDraft] = useState<AdsPromotionDraft>(emptyPromotionDraft());
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
  const sections = [
    { id: "creative" as const, label: "Creative", done: Boolean(draft.headline && draft.coverUrl) },
    { id: "targeting" as const, label: "Targeting", done: draft.slots.length > 0 },
    { id: "schedule" as const, label: "Schedule", done: Boolean(draft.startsAt && draft.endsAt) },
    { id: "publish" as const, label: "Publish", done: completeness.ready },
  ];

  function patch(next: Partial<AdsPromotionDraft>) {
    setDraft((current) => ({ ...current, ...next }));
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
        setMessage("Created");
        router.replace(`/admin/ads/${created.id}`);
      } else {
        await api.admin.updatePromotion(params.id, body);
        setDraft((current) => ({ ...current, status: body.status }));
        setMessage("Saved");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Megaphone}
        kicker="Ads studio"
        title={isNew ? "New campaign" : draft.name || "Edit campaign"}
        description="Customize creative, targeting, schedule, and publish with a live preview."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/ads">All campaigns</Link>
          </Button>
        }
      />
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      {message ? <FormStatus>{message}</FormStatus> : null}
      <StudioShell
        nav={<CreatorSectionNav sections={sections} active={section} onSelect={(id) => setSection(id as Section)} />}
        previewLabel="Ad preview"
        previewTitle={draft.name || "Campaign preview"}
        previewHint={`${completeness.score}/${completeness.total}`}
        previewThumb={draft.coverUrl}
        preview={
          <PromotionPreview
            promo={draft}
            slotHint={draft.slots.length ? `Slots: ${draft.slots.join(", ")}` : "Pick at least one slot"}
          />
        }
      >
        {section === "creative" ? <PromotionCreativeFields value={draft} onChange={patch} /> : null}
        {section === "targeting" ? (
          <div className="grid gap-4">
            <PromotionTargetingFields value={draft} onChange={patch} categoryOptions={categoryOptions} />
            <div className="rounded-2xl border border-border/60 p-4">
              <label className="mb-2 block text-sm font-medium">Linked vendor (optional)</label>
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
            </div>
          </div>
        ) : null}
        {section === "schedule" || section === "publish" ? (
          <div className="grid gap-4">
            <PromotionScheduleFields value={draft} onChange={patch} />
            <CompletenessChecklist
              score={completeness.score}
              total={completeness.total}
              missing={completeness.missing}
              ready={completeness.ready}
            />
          </div>
        ) : null}
        <StickyActionBar>
          <span className="mr-auto text-sm text-muted-foreground">
            {completeness.score}/{completeness.total} ready
          </span>
          <Button variant="outline" disabled={saving} onClick={() => void save("DRAFT")}>
            Save draft
          </Button>
          <Button disabled={saving || !completeness.ready} onClick={() => void save("ACTIVE")}>
            Publish live
          </Button>
          {!isNew ? (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={async () => {
                await api.admin.deletePromotion(params.id);
                router.push("/admin/ads");
              }}
            >
              Delete
            </Button>
          ) : null}
        </StickyActionBar>
      </StudioShell>
    </div>
  );
}
