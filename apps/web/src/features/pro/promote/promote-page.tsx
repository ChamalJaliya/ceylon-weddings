"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Megaphone, Plus } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  promotionCompleteness,
  type Promotion,
  type UpsertPromotionBody,
  type VendorCategory,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { CreatorSectionNav, StickyActionBar, StudioShell } from "@ceylonweddings/ui/domain/creator-form";
import {
  emptyPromotionDraft,
  nextPromotionSection,
  PromotionCreativeFields,
  PromotionPerf,
  PromotionPreview,
  PromotionProgress,
  PromotionReview,
  PromotionRowSummary,
  PromotionScheduleFields,
  promotionSections,
  PromotionStatusBadge,
  PromotionTargetingFields,
  SLOT_META,
  type AdsPromotionDraft,
  type PromotionSectionId,
} from "@ceylonweddings/ui/domain/ads-studio";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";

import { CATEGORY_LABELS, localizedText } from "@/lib/labels";
import { uploadImage } from "@/lib/upload-image";

const LIST_COLUMNS = ["campaign", "placements", "status", "perf", "actions"] as const;

export default function VendorPromotePage() {
  const locale = useLocale();
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [rows, setRows] = useState<Promotion[]>([]);
  const [section, setSection] = useState<PromotionSectionId>("creative");
  const [draft, setDraft] = useState<AdsPromotionDraft>(
    emptyPromotionDraft({ source: "PAID_PENDING", status: "DRAFT", slots: ["CATALOG_TOP", "HOME_PICKS"] }),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState(
    Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  );

  const load = useCallback(async () => {
    try {
      setListLoading(true);
      setRows(await api.promotions.mine());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setListLoading(false);
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
      toast.success(status === "SCHEDULED" ? "Submitted for review" : "Draft saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const filtered = rows;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, "");

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
              <Plus className="size-4" aria-hidden />
              New promotion
            </Button>
          }
        />
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <SectionCard title="Your campaigns" icon={Megaphone}>
          <DataTableList
            framed={false}
            loading={listLoading}
            loadingColumns={LIST_COLUMNS.length}
            sourceCount={rows.length}
            filteredCount={filtered.length}
            empty={{
              icon: Megaphone,
              title: "No promotions yet",
              description: "Launch a campaign with your own creative.",
            }}
            pagination={
              totalPages > 0
                ? {
                    page,
                    totalPages,
                    total,
                    limit,
                    onPageChange: setPage,
                    onLimitChange: setLimit,
                  }
                : null
            }
            items={pageItems}
            getRowId={(row) => row.id}
            orderedVisibleIds={LIST_COLUMNS}
            renderHead={(id) => {
              const labels: Record<(typeof LIST_COLUMNS)[number], string> = {
                campaign: "Campaign",
                placements: "Placements",
                status: "Status",
                perf: "Performance",
                actions: "",
              };
              return <DataTableHead key={id}>{labels[id as (typeof LIST_COLUMNS)[number]]}</DataTableHead>;
            }}
            renderCell={(id, row) => {
              switch (id) {
                case "campaign":
                  return (
                    <DataTableCell key={id}>
                      <PromotionRowSummary promo={row} />
                    </DataTableCell>
                  );
                case "placements":
                  return (
                    <DataTableCell key={id} className="text-xs text-muted-foreground">
                      {row.slots.map((slot) => SLOT_META[slot].label).join(", ") || "—"}
                    </DataTableCell>
                  );
                case "status":
                  return (
                    <DataTableCell key={id}>
                      <PromotionStatusBadge status={row.status} />
                    </DataTableCell>
                  );
                case "perf":
                  return (
                    <DataTableCell key={id}>
                      <PromotionPerf impressions={row.impressionCount} clicks={row.clickCount} />
                    </DataTableCell>
                  );
                case "actions":
                  return (
                    <DataTableCell key={id}>
                      <Button size="sm" variant="ghost" onClick={() => void openEdit(row.id)}>
                        Edit
                      </Button>
                    </DataTableCell>
                  );
                default:
                  return null;
              }
            }}
          />
        </SectionCard>
      </div>
    );
  }

  const sections = promotionSections(draft, completeness);
  const prev = nextPromotionSection(section, -1);
  const next = nextPromotionSection(section, 1);
  const categoryLabel = (value: string) => categoryOptions.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Megaphone}
        kicker="Promote studio"
        title={draft.name || "New promotion"}
        description="Design your ad, choose where couples see it, and preview it live."
        actions={
          <div className="flex items-center gap-2">
            {editId ? <PromotionStatusBadge status={draft.status} /> : null}
            <Button variant="ghost" size="sm" onClick={() => setMode("list")}>
              <ArrowLeft className="size-4" aria-hidden />
              Your campaigns
            </Button>
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
        previewTitle={draft.name || "New promotion"}
        previewHint={`${completeness.score}/${completeness.total}`}
        previewThumb={draft.coverUrl}
        preview={<PromotionPreview promo={draft} />}
      >
        {section === "creative" ? (
          <PromotionCreativeFields
            value={draft}
            onChange={patch}
            onUpload={(file) => uploadImage(file, (body) => api.vendors.presignMedia({ ...body, kind: "image" }))}
          />
        ) : null}
        {section === "targeting" ? (
          <PromotionTargetingFields value={draft} onChange={patch} categoryOptions={categoryOptions} />
        ) : null}
        {section === "schedule" ? (
          <PromotionScheduleFields value={draft} onChange={patch} showSource={false} showStatus={false} />
        ) : null}
        {section === "publish" ? (
          <PromotionReview
            promo={draft}
            completeness={completeness}
            onJump={setSection}
            categoryLabel={categoryLabel}
            readyNote="Looks good — submit it and our team will review it before it goes live."
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
            <Button disabled={saving || !completeness.ready} onClick={() => void save("SCHEDULED")}>
              Submit for review
            </Button>
          )}
        </StickyActionBar>
      </StudioShell>
    </div>
  );
}
