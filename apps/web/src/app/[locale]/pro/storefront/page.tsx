"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import {
  formatPackagePriceLabel,
  packageBadgeSchema,
  packageEventTypeSchema,
  packagePricingModeSchema,
  packageStatusSchema,
  type PublicVendorTypeListItem,
  type UpdateVendorBody,
  type UpsertVendorAddOnBody,
  type UpsertVendorPackageBody,
  type Vendor,
  type VendorAttributeAnswerValue,
  type VendorAttributeDefinition,
  type VendorFaq,
  type VendorOnboardingResponse,
  MEDIA_IMAGE_CONTENT_TYPES,
  MEDIA_IMAGE_MAX_BYTES,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import {
  AttributeField,
  isAttributeAnswered,
  type AttributeFieldValue,
} from "@ceylonweddings/ui/domain/attribute-field";
import {
  CompletenessChecklist,
  CreatorSectionNav,
  FieldBlock,
  FormGrid,
  FormSection,
  StickyActionBar,
  StudioShell,
  TagInput,
} from "@ceylonweddings/ui/domain/creator-form";
import {
  AddOnEditor,
  FaqEditor,
  MediaStudioEditor,
  PackageCardEditor,
  StorefrontPreview,
  StudioPanel,
} from "@ceylonweddings/ui/domain/offer-studio";
import type { MediaStudioProject, MediaStudioVideo } from "@ceylonweddings/ui/domain/media-studio";
import { Link } from "../../../../i18n/navigation";
import { PlaceFields } from "../../../../components/place-fields";
import { CATEGORY_LABELS, localizedText } from "../../../../lib/labels";
import { offerTemplatesForCategory, TEMPLATE_LABELS } from "../../../../lib/offer-templates";
import { Smartphone, Store } from "lucide-react";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";

type Section = "basics" | "details" | "media" | "offers" | "presence" | "faqs" | "publish";

function toFieldDef(def: VendorAttributeDefinition, locale: string) {
  return {
    key: def.key,
    valueType: def.valueType,
    question: localizedText(def.question, locale),
    instruction: def.instruction ? localizedText(def.instruction, locale) : null,
    helpText: def.helpText ? localizedText(def.helpText, locale) : null,
    unit: def.unit,
    minValue: def.minValue,
    maxValue: def.maxValue,
    maxSelect: def.maxSelect,
    layout: def.layout,
    options: (def.options ?? [])
      .filter((option) => option.active)
      .map((option) => ({
        key: option.key,
        label: localizedText(option.label, locale),
        helpText: option.helpText ? localizedText(option.helpText, locale) : null,
      })),
  };
}

type PackageDraft = UpsertVendorPackageBody & { id?: string };
type AddOnDraft = UpsertVendorAddOnBody & { key: string };

function emptyPackage(index: number): PackageDraft {
  return {
    name: `Package ${index + 1}`,
    pricingMode: "FROM",
    priceLkr: null,
    priceMaxLkr: null,
    description: "",
    status: "DRAFT",
    sortOrder: index,
    badge: null,
    inclusions: [],
    exclusions: [],
    eventTypes: ["WEDDING"],
    durationHours: null,
    guestMin: null,
    guestMax: null,
    photoUrls: [],
    bestFor: null,
    addOnIds: [],
    tier: null,
  };
}

function emptyAddOn(): AddOnDraft {
  const key = `new-${crypto.randomUUID()}`;
  return {
    key,
    clientKey: key,
    name: "Add-on",
    description: "",
    pricingMode: "FIXED",
    priceLkr: null,
  };
}

function mapPackages(next: Vendor): PackageDraft[] {
  return (next.packages ?? []).map((pkg, index) => ({
    id: pkg.id,
    name: pkg.name,
    tier: pkg.tier,
    pricingMode: pkg.pricingMode,
    priceLkr: pkg.priceLkr,
    priceMaxLkr: pkg.priceMaxLkr,
    description: pkg.description,
    status: pkg.status,
    sortOrder: pkg.sortOrder ?? index,
    badge: pkg.badge,
    inclusions: pkg.inclusions ?? [],
    exclusions: pkg.exclusions ?? [],
    eventTypes: pkg.eventTypes ?? [],
    durationHours: pkg.durationHours,
    guestMin: pkg.guestMin,
    guestMax: pkg.guestMax,
    photoUrls: pkg.photoUrls ?? [],
    bestFor: pkg.bestFor,
    addOnIds: pkg.addOnIds ?? [],
  }));
}

function mapAddOns(next: Vendor): AddOnDraft[] {
  return (next.addOns ?? []).map((addOn) => ({
    key: addOn.id,
    id: addOn.id,
    clientKey: addOn.id,
    name: addOn.name,
    description: addOn.description ?? "",
    pricingMode: addOn.pricingMode,
    priceLkr: addOn.priceLkr,
  }));
}

export default function StorefrontEditPage() {
  const locale = useLocale();
  const currency = usePreferenceStore((state) => state.currency);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [types, setTypes] = useState<PublicVendorTypeListItem[]>([]);
  const [onboarding, setOnboarding] = useState<VendorOnboardingResponse | null>(null);
  const [attrValues, setAttrValues] = useState<Record<string, VendorAttributeAnswerValue>>({});
  const [packages, setPackages] = useState<PackageDraft[]>([]);
  const [addOns, setAddOns] = useState<AddOnDraft[]>([]);
  const [faqs, setFaqs] = useState<VendorFaq[]>([]);
  const [section, setSection] = useState<Section>("basics");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.vendors.mine(), api.vendorTypes(), api.vendors.onboarding()])
      .then(([next, typeList, onboard]) => {
        setVendor(next);
        setTypes(typeList);
        setOnboarding(onboard);
        setAttrValues(onboard.values ?? {});
        setPackages(mapPackages(next));
        setAddOns(mapAddOns(next));
        setFaqs(next.faqs ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const completeness = vendor?.completeness;
  const attributeCompleteness = vendor?.attributeCompleteness ?? onboarding?.attributeCompleteness;
  const hasStyleAttribute = Boolean(
    [...(onboarding?.definitions.required ?? []), ...(onboarding?.definitions.optional ?? [])].some(
      (def) => def.key === "style",
    ),
  );
  const money = (value: number) => formatMoney(value, currency);

  const previewPackages = useMemo(
    () =>
      packages
        .filter((pkg) => pkg.status === "PUBLISHED")
        .map((pkg, index) => ({
          id: pkg.id ?? `draft-${index}`,
          name: pkg.name,
          priceLabel: formatPackagePriceLabel(
            {
              pricingMode: pkg.pricingMode,
              priceLkr: pkg.priceLkr ?? null,
              priceMaxLkr: pkg.priceMaxLkr ?? null,
              showPricing: vendor?.showPricing !== false,
            },
            money,
            "Inquire for pricing",
          ),
          description: pkg.description,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          badge: pkg.badge,
          bestFor: pkg.bestFor,
        })),
    [packages, currency, vendor?.showPricing],
  );

  if (error) {
    return (
      <p className="text-sm">
        {error}. <Link href="/login">Sign in</Link>
      </p>
    );
  }
  if (!vendor) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function onSave(event?: FormEvent) {
    event?.preventDefault();
    if (!vendor) return;
    setSaving(true);
    setStatus(null);
    try {
      const body: UpdateVendorBody = {
        name: vendor.name,
        category: vendor.category,
        city: vendor.city,
        district: vendor.district,
        startingPriceLkr: vendor.startingPriceLkr,
        priceDisplayMode: vendor.priceDisplayMode,
        typicalSpendLkr: vendor.typicalSpendLkr ?? null,
        offerHeadline: vendor.offerHeadline ?? null,
        taxesExtra: vendor.taxesExtra ?? false,
        taxNote: vendor.taxNote ?? null,
        depositNote: vendor.depositNote ?? null,
        cancellationNote: vendor.cancellationNote ?? null,
        pricingDisclaimer: vendor.pricingDisclaimer ?? null,
        showPricing: vendor.showPricing !== false,
        listed: vendor.listed !== false,
        serviceAreas: vendor.serviceAreas ?? [],
        travelNote: vendor.travelNote ?? null,
        overtimeNote: vendor.overtimeNote ?? null,
        whatsapp: vendor.whatsapp,
        description: vendor.description,
        photoUrl: vendor.photoUrl ?? null,
        photos: vendor.photos ?? [],
        introVideoUrl: vendor.introVideoUrl ?? null,
        yearsExperience: vendor.yearsExperience,
        couplesServed: vendor.couplesServed,
        includedInPrice: vendor.includedInPrice ?? [],
        instagram: vendor.instagram ?? null,
        facebook: vendor.facebook ?? null,
        websiteUrl: vendor.websiteUrl ?? null,
        styles: vendor.styles,
        destinationExperienced: vendor.destinationExperienced,
        faqs,
        mediaProjects: (vendor.mediaProjects ?? []).map((project, index) => ({
          id: project.id.startsWith("local-") ? undefined : project.id,
          title: project.title,
          description: project.description ?? null,
          coverUrl: project.coverUrl ?? null,
          eventDate: project.eventDate ?? null,
          sortOrder: project.sortOrder ?? index,
          items: (project.items ?? []).map((item, itemIndex) => ({
            id: item.id.startsWith("local-") ? undefined : item.id,
            url: item.url,
            sortOrder: item.sortOrder ?? itemIndex,
          })),
        })),
        videos: (vendor.videos ?? []).map((video, index) => ({
          id: video.id.startsWith("local-") ? undefined : video.id,
          url: video.url,
          title: video.title ?? null,
          sortOrder: video.sortOrder ?? index,
        })),
        addOns: addOns.map(({ key: _key, ...addOn }) => addOn),
        packages: packages.map((pkg) => ({
          ...pkg,
          addOnIds: (pkg.addOnIds ?? []).map((id) => {
            const match = addOns.find((item) => item.key === id || item.id === id || item.clientKey === id);
            return match?.clientKey ?? match?.id ?? id;
          }),
        })),
      };
      const updated = await api.vendors.updateMine(body);
      setVendor(updated);
      setPackages(mapPackages(updated));
      setAddOns(mapAddOns(updated));
      setFaqs(updated.faqs ?? []);
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const sections: Array<{ id: Section; label: string; done?: boolean }> = [
    { id: "basics", label: "Basics", done: !completeness?.missing.includes("name") && !completeness?.missing.includes("description") },
    {
      id: "details",
      label: "Details",
      done: attributeCompleteness
        ? attributeCompleteness.requiredDone >= attributeCompleteness.requiredTotal
        : true,
    },
    { id: "media", label: "Media", done: !completeness?.missing.includes("media") },
    { id: "offers", label: "Offers", done: !completeness?.missing.includes("offer") },
    { id: "presence", label: "Presence", done: !completeness?.missing.includes("whatsapp") },
    { id: "faqs", label: "FAQs" },
    { id: "publish", label: "Publish", done: completeness?.ready },
  ];

  return (
    <StudioShell
      nav={<CreatorSectionNav sections={sections} active={section} onSelect={(id) => setSection(id as Section)} />}
      previewLabel="Live preview"
      previewTitle={vendor.name}
      previewHint={completeness ? `${completeness.score}/${completeness.total}` : undefined}
      previewThumb={vendor.photoUrl ?? vendor.photos?.[0] ?? null}
      previewFooter={
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/vendors/${vendor.slug}`}>Open live listing</Link>
        </Button>
      }
      preview={
        <StorefrontPreview
          name={vendor.name}
          city={vendor.city}
          district={vendor.district}
          offerHeadline={vendor.offerHeadline}
          coverUrl={vendor.photoUrl}
          photos={vendor.photos ?? []}
          projects={(vendor.mediaProjects ?? []).map((project) => ({
            id: project.id,
            title: project.title,
            coverUrl: project.coverUrl,
            items: project.items ?? [],
          }))}
          introVideoUrl={vendor.introVideoUrl}
          videos={(vendor.videos ?? []).map((video) => ({
            id: video.id,
            url: video.url,
            title: video.title,
          }))}
          cinematic={vendor.galleryLayout ?? "default"}
          verified={vendor.verified}
          featured={vendor.featured}
          destination={vendor.destinationExperienced}
          packages={previewPackages}
          completeness={completeness}
          listed={vendor.listed !== false}
          showPricing={vendor.showPricing !== false}
          websiteUrl={vendor.websiteUrl}
        />
      }
    >
      {({ open, toggle }) => (
        <>
      <div className="grid gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">Pro storefront</p>
        <PageHeader
          icon={Store}
          title="Storefront studio"
          description={
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs">/vendors/{vendor.slug}</span>
              <span>Shape how couples fall for your work — and inquire.</span>
            </span>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant={open ? "secondary" : "outline"} size="sm" iconLeft={Smartphone} onClick={toggle}>
                {open ? "Hide preview" : "Preview"}
              </Button>
              <SimpleSelect
                className={`xl:hidden ${fieldClass}`}
                value={section}
                onValueChange={(value) => setSection(value as Section)}
                options={sections.map((item) => ({ value: item.id, label: item.label }))}
              />
            </div>
          }
        />
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/30 p-5 md:p-6">
        {section === "basics" ? (
          <FormSection title="Basics" description="Who you are and where couples find you.">
            <FieldBlock label="Business name">
              <Input
                className={fieldClass}
                value={vendor.name}
                onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock label="Category">
              <SimpleSelect
                className={fieldClass}
                value={vendor.category || types[0]?.slug || ""}
                onValueChange={async (value) => {
                  setVendor({ ...vendor, category: value as Vendor["category"] });
                  try {
                    const updated = await api.vendors.updateMine({ category: value });
                    setVendor(updated);
                    const onboard = await api.vendors.onboarding();
                    setOnboarding(onboard);
                    setAttrValues(onboard.values ?? {});
                  } catch (err) {
                    setStatus(err instanceof Error ? err.message : "Could not update category");
                  }
                }}
                options={types.map((type) => ({
                  value: type.slug,
                  label: localizedText(type.label, locale) || CATEGORY_LABELS[type.slug] || type.slug,
                }))}
              />
            </FieldBlock>
            <PlaceFields
              city={vendor.city}
              district={vendor.district}
              onCityChange={(city) => setVendor((current) => (current ? { ...current, city } : current))}
              onDistrictChange={(district) => setVendor((current) => (current ? { ...current, district } : current))}
              fieldClass={fieldClass}
            />
            <FieldBlock label="Description" hint="Lead with the feeling of your work — 2–4 sentences.">
              <Textarea
                value={vendor.description ?? ""}
                onChange={(e) => setVendor({ ...vendor, description: e.target.value })}
              />
            </FieldBlock>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldBlock label="Years experience">
                <Input
                  className={fieldClass}
                  type="number"
                  value={vendor.yearsExperience ?? 0}
                  onChange={(e) => setVendor({ ...vendor, yearsExperience: Number(e.target.value) })}
                />
              </FieldBlock>
              <FieldBlock label="Couples served">
                <Input
                  className={fieldClass}
                  type="number"
                  value={vendor.couplesServed ?? 0}
                  onChange={(e) => setVendor({ ...vendor, couplesServed: Number(e.target.value) })}
                />
              </FieldBlock>
            </div>
          </FormSection>
        ) : null}

        {section === "details" ? (
          <FormSection
            title="Details"
            description="Type-specific answers power couple filters. Required first, optional unlocks discoverability."
          >
            {attributeCompleteness ? (
              <div className="rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
                <p>
                  Required {attributeCompleteness.requiredDone}/{attributeCompleteness.requiredTotal}
                  {" · "}
                  Optional {attributeCompleteness.optionalDone}/{attributeCompleteness.optionalTotal}
                  {" · "}
                  Discoverability {attributeCompleteness.discoverabilityScore}%
                </p>
              </div>
            ) : null}
            <div className="grid gap-6">
              <div className="grid gap-3">
              {(onboarding?.definitions.required ?? []).map((def) => (
                <AttributeField
                  key={def.key}
                  collapsible
                  definition={toFieldDef(def, locale)}
                  value={attrValues[def.key] as AttributeFieldValue | undefined}
                  onChange={async (next) => {
                    setAttrValues((current) => ({ ...current, [def.key]: next }));
                    try {
                      const updated = await api.vendors.putAttributes({ values: { [def.key]: next } });
                      setVendor(updated);
                      setAttrValues((current) => ({ ...current, [def.key]: next }));
                    } catch (err) {
                      setStatus(err instanceof Error ? err.message : "Could not save attribute");
                    }
                  }}
                />
              ))}
              </div>
              {(onboarding?.definitions.optional ?? []).length ? (
                <div className="grid gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold">Optional</h3>
                    <p className="text-sm text-muted-foreground">Unlocks couple filters when answered.</p>
                  </div>
                  {(onboarding?.definitions.optional ?? []).map((def) => (
                    <AttributeField
                      key={def.key}
                      collapsible
                      definition={toFieldDef(def, locale)}
                      value={attrValues[def.key] as AttributeFieldValue | undefined}
                      hint={
                        !isAttributeAnswered(attrValues[def.key] as AttributeFieldValue | undefined)
                          ? "Unlocks couple filters"
                          : null
                      }
                      onChange={async (next) => {
                        setAttrValues((current) => ({ ...current, [def.key]: next }));
                        try {
                          const updated = await api.vendors.putAttributes({ values: { [def.key]: next } });
                          setVendor(updated);
                        } catch (err) {
                          setStatus(err instanceof Error ? err.message : "Could not save attribute");
                        }
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {!onboarding?.definitions.required.length && !onboarding?.definitions.optional.length ? (
                <p className="text-sm text-muted-foreground">
                  No type-specific questions yet. Pick a category in Basics, or finish onboarding.
                </p>
              ) : null}
            </div>
          </FormSection>
        ) : null}

        {section === "media" ? (
          <FormSection title="Media" description="Cover, gallery, optional projects, and video — upload or paste URLs.">
            <MediaStudioEditor
              coverUrl={vendor.photoUrl ?? ""}
              galleryUrls={vendor.photos ?? []}
              introVideoUrl={vendor.introVideoUrl ?? ""}
              projects={(vendor.mediaProjects ?? []).map((project) => ({
                id: project.id,
                title: project.title,
                description: project.description,
                coverUrl: project.coverUrl,
                eventDate: project.eventDate,
                sortOrder: project.sortOrder,
                items: project.items ?? [],
              }))}
              videos={(vendor.videos ?? []).map((video) => ({
                id: video.id,
                url: video.url,
                title: video.title,
                sortOrder: video.sortOrder,
              }))}
              onCoverChange={(photoUrl) => setVendor({ ...vendor, photoUrl })}
              onGalleryChange={(photos) => setVendor({ ...vendor, photos })}
              onIntroVideoChange={(introVideoUrl) => setVendor({ ...vendor, introVideoUrl: introVideoUrl || null })}
              onProjectsChange={(projects: MediaStudioProject[]) =>
                setVendor({
                  ...vendor,
                  mediaProjects: projects.map((project, index) => ({
                    id: project.id ?? `local-${index}`,
                    vendorId: vendor.id,
                    title: project.title,
                    description: project.description ?? null,
                    coverUrl: project.coverUrl ?? null,
                    eventDate: project.eventDate ?? null,
                    sortOrder: project.sortOrder ?? index,
                    items: project.items.map((item, itemIndex) => ({
                      id: item.id ?? `local-item-${index}-${itemIndex}`,
                      url: item.url,
                      sortOrder: item.sortOrder ?? itemIndex,
                    })),
                  })),
                })
              }
              onVideosChange={(videos: MediaStudioVideo[]) =>
                setVendor({
                  ...vendor,
                  videos: videos.map((video, index) => ({
                    id: video.id ?? `local-video-${index}`,
                    vendorId: vendor.id,
                    url: video.url,
                    title: video.title ?? null,
                    sortOrder: video.sortOrder ?? index,
                  })),
                })
              }
              onUpload={async (file, kind) => {
                if (file.size > MEDIA_IMAGE_MAX_BYTES) {
                  throw new Error("Image must be under 10MB");
                }
                const contentType = file.type as (typeof MEDIA_IMAGE_CONTENT_TYPES)[number];
                if (!(MEDIA_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType)) {
                  throw new Error("Use JPEG, PNG, WebP, or GIF");
                }
                const { uploadUrl, publicUrl } = await api.vendors.presignMedia({
                  contentType,
                  filename: file.name,
                  kind,
                });
                const put = await fetch(uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": contentType },
                  body: file,
                });
                if (!put.ok) {
                  throw new Error("Upload to storage failed");
                }
                return publicUrl;
              }}
            />
          </FormSection>
        ) : null}

        {section === "offers" ? (
          <FormSection title="Offers" description="How you sell — packages, pricing, and inclusions.">
            <FieldBlock label="Offer headline" hint="One line that sells the feeling of your work.">
              <Input
                className={fieldClass}
                value={vendor.offerHeadline ?? ""}
                onChange={(e) => setVendor({ ...vendor, offerHeadline: e.target.value })}
                placeholder="Two-day Kandyan coverage"
              />
            </FieldBlock>
            <div className="grid gap-5 sm:grid-cols-3">
              <FieldBlock label="Price display">
                <SimpleSelect
                  className={fieldClass}
                  value={vendor.priceDisplayMode}
                  onValueChange={(value) =>
                    setVendor({ ...vendor, priceDisplayMode: value as Vendor["priceDisplayMode"] })
                  }
                  options={[
                    { value: "FROM", label: "From" },
                    { value: "FIXED", label: "Fixed" },
                    { value: "ON_REQUEST", label: "On request" },
                  ]}
                />
              </FieldBlock>
              <FieldBlock label="Starting price (LKR)">
                <Input
                  className={fieldClass}
                  type="number"
                  value={vendor.startingPriceLkr ?? ""}
                  onChange={(e) =>
                    setVendor({
                      ...vendor,
                      startingPriceLkr: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </FieldBlock>
              <FieldBlock label="Typical spend (LKR)">
                <Input
                  className={fieldClass}
                  type="number"
                  value={vendor.typicalSpendLkr ?? ""}
                  onChange={(e) =>
                    setVendor({
                      ...vendor,
                      typicalSpendLkr: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </FieldBlock>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
              <span className="grid gap-0.5 pr-4">
                <span>Show prices to couples</span>
                <span className="text-xs text-muted-foreground">
                  Off means guests see “Inquire for pricing” instead of LKR amounts. You still keep prices here.
                </span>
              </span>
              <Switch
                checked={vendor.showPricing !== false}
                onCheckedChange={(checked) => setVendor({ ...vendor, showPricing: checked })}
              />
            </label>
            <FieldBlock label="Included for every inquiry">
              <TagInput
                values={vendor.includedInPrice ?? []}
                onChange={(includedInPrice) => setVendor({ ...vendor, includedInPrice })}
              />
            </FieldBlock>
            <FieldBlock label="Pricing disclaimer">
              <Input
                className={fieldClass}
                value={vendor.pricingDisclaimer ?? ""}
                onChange={(e) => setVendor({ ...vendor, pricingDisclaimer: e.target.value })}
                placeholder="Prices indicative; final quote after consultation"
              />
            </FieldBlock>

            <StudioPanel title="Commercial notes" description="Tax, deposit, and cancellation — the trust details.">
              <FormGrid cols={1} className="gap-4">
                <FieldBlock label="Tax note" compact>
                  <Input
                    className={fieldClass}
                    value={vendor.taxNote ?? ""}
                    onChange={(e) => setVendor({ ...vendor, taxNote: e.target.value || null })}
                    placeholder="VAT exclusive unless stated"
                  />
                </FieldBlock>
                <FieldBlock label="Deposit note" compact>
                  <Input
                    className={fieldClass}
                    value={vendor.depositNote ?? ""}
                    onChange={(e) => setVendor({ ...vendor, depositNote: e.target.value || null })}
                    placeholder="40% to confirm the date"
                  />
                </FieldBlock>
                <FieldBlock label="Cancellation note" compact>
                  <Input
                    className={fieldClass}
                    value={vendor.cancellationNote ?? ""}
                    onChange={(e) => setVendor({ ...vendor, cancellationNote: e.target.value || null })}
                    placeholder="Deposit non-refundable within 60 days"
                  />
                </FieldBlock>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
                  <span>Taxes are extra</span>
                  <Switch
                    checked={vendor.taxesExtra ?? false}
                    onCheckedChange={(checked) => setVendor({ ...vendor, taxesExtra: checked })}
                  />
                </label>
              </FormGrid>
            </StudioPanel>

            <AddOnEditor
              items={addOns}
              pricingModes={packagePricingModeSchema.options}
              onAdd={() => setAddOns([...addOns, emptyAddOn()])}
              onChange={(index, next) => {
                const row = [...addOns];
                row[index] = {
                  ...addOns[index]!,
                  name: next.name,
                  pricingMode: next.pricingMode as AddOnDraft["pricingMode"],
                  priceLkr: next.priceLkr,
                };
                setAddOns(row);
              }}
              onRemove={(index) => {
                const removed = addOns[index]!;
                setAddOns(addOns.filter((_, i) => i !== index));
                setPackages(
                  packages.map((pkg) => ({
                    ...pkg,
                    addOnIds: (pkg.addOnIds ?? []).filter(
                      (id) => id !== removed.key && id !== removed.id && id !== removed.clientKey,
                    ),
                  })),
                );
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="grid gap-0.5">
                <h3 className="font-medium tracking-tight">Packages</h3>
                <p className="text-xs text-muted-foreground">
                  {packages.length} offer{packages.length === 1 ? "" : "s"} — published ones appear in the live preview
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_LABELS[vendor.category] ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPackages([
                        ...packages,
                        ...offerTemplatesForCategory(vendor.category).map((pkg, index) => ({
                          ...pkg,
                          sortOrder: packages.length + index,
                        })),
                      ])
                    }
                  >
                    {TEMPLATE_LABELS[vendor.category]}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPackages([...packages, emptyPackage(packages.length)])}
                >
                  Add package
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {packages.map((pkg, index) => (
                <PackageCardEditor
                  key={pkg.id ?? `new-${index}`}
                  index={index}
                  pkg={{
                    id: pkg.id,
                    name: pkg.name,
                    status: pkg.status,
                    pricingMode: pkg.pricingMode,
                    priceLkr: pkg.priceLkr ?? null,
                    priceMaxLkr: pkg.priceMaxLkr ?? null,
                    badge: pkg.badge ?? null,
                    description: pkg.description ?? null,
                    inclusions: pkg.inclusions ?? [],
                    exclusions: pkg.exclusions ?? [],
                    eventTypes: pkg.eventTypes ?? [],
                    durationHours: pkg.durationHours ?? null,
                    guestMin: pkg.guestMin ?? null,
                    guestMax: pkg.guestMax ?? null,
                    photoUrls: pkg.photoUrls ?? [],
                    bestFor: pkg.bestFor ?? null,
                    addOnIds: pkg.addOnIds ?? [],
                  }}
                  statusOptions={packageStatusSchema.options}
                  pricingModes={packagePricingModeSchema.options}
                  badgeOptions={packageBadgeSchema.options}
                  eventTypeOptions={packageEventTypeSchema.options}
                  addOnOptions={addOns}
                  onChange={(next) => {
                    const row = [...packages];
                    row[index] = {
                      ...pkg,
                      name: next.name,
                      status: next.status as PackageDraft["status"],
                      pricingMode: next.pricingMode as PackageDraft["pricingMode"],
                      priceLkr: next.priceLkr,
                      priceMaxLkr: next.priceMaxLkr,
                      badge: next.badge as PackageDraft["badge"],
                      description: next.description,
                      inclusions: next.inclusions,
                      exclusions: next.exclusions,
                      eventTypes: next.eventTypes as PackageDraft["eventTypes"],
                      durationHours: next.durationHours,
                      guestMin: next.guestMin,
                      guestMax: next.guestMax,
                      photoUrls: next.photoUrls,
                      bestFor: next.bestFor,
                      addOnIds: next.addOnIds,
                    };
                    setPackages(row);
                  }}
                  onRemove={() => setPackages(packages.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          </FormSection>
        ) : null}

        {section === "presence" ? (
          <FormSection title="Presence" description="How couples reach you and where you work.">
            <FieldBlock label="WhatsApp">
              <Input
                className={fieldClass}
                value={vendor.whatsapp ?? ""}
                onChange={(e) => setVendor({ ...vendor, whatsapp: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock label="Official website" hint="Optional. Couples see this as a Website link on your listing.">
              <Input
                className={fieldClass}
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://www.yourstudio.lk"
                value={vendor.websiteUrl ?? ""}
                onChange={(e) => setVendor({ ...vendor, websiteUrl: e.target.value || null })}
              />
            </FieldBlock>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldBlock label="Instagram">
                <Input
                  className={fieldClass}
                  value={vendor.instagram ?? ""}
                  onChange={(e) => setVendor({ ...vendor, instagram: e.target.value })}
                />
              </FieldBlock>
              <FieldBlock label="Facebook">
                <Input
                  className={fieldClass}
                  value={vendor.facebook ?? ""}
                  onChange={(e) => setVendor({ ...vendor, facebook: e.target.value })}
                />
              </FieldBlock>
            </div>
            {!hasStyleAttribute ? (
              <FieldBlock label="Styles">
                <TagInput values={vendor.styles} onChange={(styles) => setVendor({ ...vendor, styles })} />
              </FieldBlock>
            ) : null}
            <FieldBlock label="Service areas">
              <TagInput
                values={vendor.serviceAreas ?? []}
                onChange={(serviceAreas) => setVendor({ ...vendor, serviceAreas })}
              />
            </FieldBlock>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldBlock label="Travel note">
                <Input
                  className={fieldClass}
                  value={vendor.travelNote ?? ""}
                  onChange={(e) => setVendor({ ...vendor, travelNote: e.target.value })}
                  placeholder="Free within Colombo; outstation on request"
                />
              </FieldBlock>
              <FieldBlock label="Overtime note">
                <Input
                  className={fieldClass}
                  value={vendor.overtimeNote ?? ""}
                  onChange={(e) => setVendor({ ...vendor, overtimeNote: e.target.value })}
                  placeholder="Extra hour from LKR 15,000"
                />
              </FieldBlock>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
              <span>Destination experienced</span>
              <Switch
                checked={vendor.destinationExperienced}
                onCheckedChange={(checked) => setVendor({ ...vendor, destinationExperienced: checked })}
              />
            </label>
          </FormSection>
        ) : null}

        {section === "faqs" ? (
          <FormSection title="FAQs" description="Answers couples ask before WhatsApp.">
            <FaqEditor
              items={faqs}
              onChange={(index, next) => {
                const row = [...faqs];
                row[index] = next;
                setFaqs(row);
              }}
              onAdd={() => setFaqs([...faqs, { question: "", answer: "" }])}
              onRemove={(index) => setFaqs(faqs.filter((_, i) => i !== index))}
            />
          </FormSection>
        ) : null}

        {section === "publish" ? (
          <FormSection title="Publish" description="Checklist before couples see a polished listing.">
            {completeness ? (
              <CompletenessChecklist
                score={completeness.score}
                total={completeness.total}
                missing={completeness.missing}
                ready={completeness.ready}
              />
            ) : null}
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 text-sm md:p-5">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                <span className="grid gap-0.5 pr-4">
                  <span>List in the marketplace</span>
                  <span className="text-xs text-muted-foreground">
                    Off hides you from search and the catalog. Couples with your link can still open the storefront.
                  </span>
                </span>
                <Switch
                  checked={vendor.listed !== false}
                  onCheckedChange={(checked) => setVendor({ ...vendor, listed: checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                <span className="grid gap-0.5 pr-4">
                  <span>Show prices to couples</span>
                  <span className="text-xs text-muted-foreground">
                    Same control as Offers — guests see inquire-for-pricing when this is off.
                  </span>
                </span>
                <Switch
                  checked={vendor.showPricing !== false}
                  onCheckedChange={(checked) => setVendor({ ...vendor, showPricing: checked })}
                />
              </label>
              <p>
                Live storefront:{" "}
                <Link href={`/vendors/${vendor.slug}`} className="text-primary underline-offset-2 hover:underline">
                  /vendors/{vendor.slug}
                </Link>
              </p>
              <p className="text-muted-foreground">
                Verified / Featured are admin-controlled
                {vendor.verified ? " · Verified" : ""}
                {vendor.featured ? " · Featured" : ""}
              </p>
            </div>
          </FormSection>
        ) : null}

        <StickyActionBar>
          <Button type="button" onClick={() => onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save storefront"}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/vendors/${vendor.slug}`}>View live</Link>
          </Button>
          <Button type="button" variant="ghost" className="xl:hidden" iconLeft={Smartphone} onClick={toggle}>
            {open ? "Hide preview" : "Preview"}
          </Button>
          {status ? (
            <FormStatus tone={status === "Saved" ? "success" : "muted"}>{status}</FormStatus>
          ) : null}
        </StickyActionBar>
      </div>
        </>
      )}
    </StudioShell>
  );
}
