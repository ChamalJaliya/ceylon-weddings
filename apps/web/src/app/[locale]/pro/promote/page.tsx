"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Megaphone } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  promotionCompleteness,
  type Promotion,
  type UpsertPromotionBody,
  type VendorCategory,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
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
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { CATEGORY_LABELS, localizedText } from "../../../../lib/labels";

type Section = "creative" | "targeting" | "schedule" | "publish";

export default function VendorPromotePage() {
  const locale = useLocale();
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [rows, setRows] = useState<Promotion[]>([]);
  const [section, setSection] = useState<Section>("creative");
  const [draft, setDraft] = useState<AdsPromotionDraft>(
    emptyPromotionDraft({ source: "PAID_PENDING", status: "DRAFT", slots: ["CATALOG_TOP", "HOME_PICKS"] }),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(
    Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  );

  const load = useCallback(async () => {
    try {
      setRows(await api.promotions.mine());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const completeness = useMemo(() => promotionCompleteness(draft), [draft]);

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
      source: "PAID_PENDING",
      notes: draft.notes,
    };
  }

  async function openNew() {
    setEditId(null);
    setDraft(emptyPromotionDraft({ source: "PAID_PENDING", status: "DRAFT", slots: ["CATALOG_TOP", "HOME_PICKS"] }));
    setSection("creative");
    setMode("edit");
  }

  async function openEdit(id: string) {
    const promo = await api.promotions.getMine(id);
    setEditId(id);
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
    setMode("edit");
  }

  async function save(status: AdsPromotionDraft["status"] = "DRAFT") {
    try {
      setSaving(true);
      setError(null);
      const body = { ...toBody(), status };
      if (editId) {
        await api.promotions.updateMine(editId, body);
      } else {
        const created = await api.promotions.createMine(body);
        setEditId(created.id);
      }
      setMessage(status === "SCHEDULED" ? "Submitted for review" : "Saved draft");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (mode === "list") {
    return (
      <div className="grid gap-8">
        <PageHeader
          icon={Megaphone}
          kicker="Grow"
          title="Promote"
          description="Design custom ads for catalog and homepage placements. Paid campaigns go to review."
          actions={
            <Button size="sm" onClick={() => void openNew()}>
              New promotion
            </Button>
          }
        />
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <SectionCard title="Your campaigns" icon={Megaphone}>
          {rows.length === 0 ? (
            <EmptyState icon={Megaphone} title="No promotions yet" description="Launch a campaign with your own creative." />
          ) : (
            <AdminDataTable headers={["Campaign", "Status", "Perf", ""]}>
              {rows.map((row) => (
                <AdminDataRow key={row.id}>
                  <AdminDataCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.headline}</p>
                  </AdminDataCell>
                  <AdminDataCell>
                    <Badge>{row.status}</Badge>
                  </AdminDataCell>
                  <AdminDataCell className="text-xs text-muted-foreground">
                    {row.impressionCount} / {row.clickCount}
                  </AdminDataCell>
                  <AdminDataCell>
                    <Button size="sm" variant="ghost" onClick={() => void openEdit(row.id)}>
                      Edit
                    </Button>
                  </AdminDataCell>
                </AdminDataRow>
              ))}
            </AdminDataTable>
          )}
        </SectionCard>
      </div>
    );
  }

  const sections = [
    { id: "creative" as const, label: "Creative", done: Boolean(draft.headline && draft.coverUrl) },
    { id: "targeting" as const, label: "Targeting", done: draft.slots.length > 0 },
    { id: "schedule" as const, label: "Schedule", done: Boolean(draft.startsAt && draft.endsAt) },
    { id: "publish" as const, label: "Publish", done: completeness.ready },
  ];

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Megaphone}
        kicker="Promote studio"
        title={draft.name || "New promotion"}
        description="Full creative control — layout, copy, media, targeting, and schedule."
        actions={
          <Button variant="outline" size="sm" onClick={() => setMode("list")}>
            Back
          </Button>
        }
      />
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      {message ? <FormStatus>{message}</FormStatus> : null}
      <StudioShell
        nav={<CreatorSectionNav sections={sections} active={section} onSelect={(id) => setSection(id as Section)} />}
        previewLabel="Ad preview"
        previewTitle={draft.name || "New promotion"}
        previewHint={`${completeness.score}/${completeness.total}`}
        previewThumb={draft.coverUrl}
        preview={<PromotionPreview promo={draft} />}
      >
        {section === "creative" ? <PromotionCreativeFields value={draft} onChange={patch} /> : null}
        {section === "targeting" ? (
          <PromotionTargetingFields value={draft} onChange={patch} categoryOptions={categoryOptions} />
        ) : null}
        {section === "schedule" || section === "publish" ? (
          <div className="grid gap-4">
            <PromotionScheduleFields value={draft} onChange={patch} showSource={false} />
            <CompletenessChecklist {...completeness} />
          </div>
        ) : null}
        <StickyActionBar>
          <span className="mr-auto text-sm text-muted-foreground">
            {completeness.score}/{completeness.total}
          </span>
          <Button variant="outline" disabled={saving} onClick={() => void save("DRAFT")}>
            Save draft
          </Button>
          <Button disabled={saving || !completeness.ready} onClick={() => void save("SCHEDULED")}>
            Submit for review
          </Button>
        </StickyActionBar>
      </StudioShell>
    </div>
  );
}
