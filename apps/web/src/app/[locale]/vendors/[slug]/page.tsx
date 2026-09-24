"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { api, formatMoney, readCatalogHref, useAuthStore, useCompareStore, usePreferenceStore } from "@ceylonweddings/web";
import {
  formatPackagePriceLabel,
  formatVendorStartingPriceLabel,
  normalizeVendorWebsiteUrl,
  toSearchParams,
  vendorWebsiteLabel,
  VENDOR_CATALOG_DEFAULTS,
  type PublicVendorTypeListItem,
  type Vendor,
  type VendorProfileAttributeChip,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ceylonweddings/ui/components/tabs";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";
import { InquirePanel, VendorStatStrip } from "@ceylonweddings/ui/domain/offer-studio";
import { PackageCompare } from "@ceylonweddings/ui/domain/package-compare";
import { ShortlistControl } from "@ceylonweddings/ui/domain/shortlist-control";
import { VendorGallery } from "@ceylonweddings/ui/domain/vendor-gallery";
import { VendorIdentity } from "@ceylonweddings/ui/domain/vendor-identity";
import { Link, useRouter } from "../../../../i18n/navigation";
import { CATEGORY_LABELS, formatAttributeDisplay, localizedText } from "../../../../lib/labels";
import { ArrowLeft, ChevronDown, MessageCircle, Scale } from "lucide-react";

function attributeCatalogHref(category: string, chip: VendorProfileAttributeChip, optionKey?: string) {
  const attrs: Record<string, string | { min?: number; max?: number }> = {};
  if (optionKey) {
    attrs[chip.key] = optionKey;
  } else if (chip.value && "boolean" in chip.value) {
    attrs[chip.key] = chip.value.boolean ? "true" : "false";
  } else if (chip.value && "number" in chip.value) {
    attrs[chip.key] = String(chip.value.number);
  } else if (chip.value && "range" in chip.value) {
    attrs[chip.key] = chip.value.range;
  }
  const qs = toSearchParams(
    { category, attrs: Object.keys(attrs).length ? attrs : undefined },
    VENDOR_CATALOG_DEFAULTS,
  ).toString();
  return qs ? `/vendors?${qs}` : `/vendors?category=${category}`;
}

type Tab = "about" | "faqs" | "reviews" | "pricing" | "location";

const DIMS = ["quality", "professionalism", "flexibility", "responseTime", "value", "communication"] as const;

export default function VendorStorefrontPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const currency = usePreferenceStore((state) => state.currency);
  const user = useAuthStore((state) => state.user);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [typeMeta, setTypeMeta] = useState<PublicVendorTypeListItem | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [catalogHref, setCatalogHref] = useState("/vendors");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [message, setMessage] = useState("We would like a quote for our wedding. Poruwa + reception, ~300 guests.");
  const [preferredDate, setPreferredDate] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [reviewBody, setReviewBody] = useState("");
  const [rating, setRating] = useState(5);
  const [shortlisted, setShortlisted] = useState(false);
  const [compareHint, setCompareHint] = useState<string | null>(null);
  const [features, setFeatures] = useState<import("@ceylonweddings/contracts").Article[]>([]);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const toggleCompare = useCompareStore((state) => state.toggle);
  const hasCompare = useCompareStore((state) => state.has);
  const compareItems = useCompareStore((state) => state.items);
  const compareCount = compareItems.length;
  const compareHref =
    compareCount >= 2 ? `/vendors/compare?slugs=${compareItems.map((item) => item.slug).join(",")}` : null;

  async function load() {
    const next = await api.vendors.get(params.slug);
    setVendor(next);
    const first = next.packages?.[0]?.id ?? null;
    setSelectedPackageId(first);
    api.vendorTypes()
      .then((list) => setTypeMeta(list.find((item) => item.slug === next.category) ?? null))
      .catch(() => setTypeMeta(null));
    api.public.articles(undefined, undefined, next.slug).then(setFeatures).catch(() => setFeatures([]));
    if (user && (user.role === "COUPLE" || user.role === "FAMILY")) {
      api.wedding
        .mine()
        .then((wedding) => setShortlisted(wedding.team.some((item) => item.vendorId === next.id)))
        .catch(() => undefined);
    }
  }

  useEffect(() => {
    setCatalogHref(readCatalogHref());
  }, []);

  useEffect(() => {
    load().catch(() => setVendor(null));
  }, [params.slug, user?.id]);

  useEffect(() => {
    void api.site
      .flags()
      .then((flags) => setReviewsEnabled(flags["reviews.enabled"] !== false))
      .catch(() => setReviewsEnabled(true));
  }, []);

  const photos = useMemo(() => {
    if (!vendor) return [];
    return (vendor.photos ?? []).filter(Boolean);
  }, [vendor]);

  const averages = useMemo(() => {
    const reviews = vendor?.reviews ?? [];
    if (!reviews.length) return null;
    const avg = (key: (typeof DIMS)[number]) =>
      reviews.reduce((sum, review) => sum + review[key], 0) / reviews.length;
    return Object.fromEntries(DIMS.map((key) => [key, avg(key)])) as Record<(typeof DIMS)[number], number>;
  }, [vendor]);

  const packageCards = useMemo(() => {
    if (!vendor) return [];
    return (vendor.packages ?? []).slice(0, 4).map((pack) => ({
      id: pack.id,
      name: pack.name,
      priceLabel: formatPackagePriceLabel(
        { ...pack, showPricing: vendor.showPricing !== false },
        (value) => formatMoney(value, currency),
        t("knotly.inquirePricing"),
      ),
      description: pack.description,
      inclusions: pack.inclusions,
      exclusions: pack.exclusions,
      addOns: (pack.addOns ?? []).map((addOn) =>
        vendor.showPricing === false
          ? addOn.name
          : addOn.priceLkr != null
            ? `${addOn.name} (${formatPackagePriceLabel({ ...addOn, showPricing: true }, (value) => formatMoney(value, currency))})`
            : addOn.name,
      ),
      badge: pack.badge,
      bestFor: pack.bestFor,
      selected: pack.id === selectedPackageId,
    }));
  }, [vendor, currency, selectedPackageId, t]);

  async function inquire(event: FormEvent) {
    event.preventDefault();
    if (!vendor) return;
    try {
      const selected = vendor.packages?.find((pkg) => pkg.id === selectedPackageId);
      const inquiry = await api.wedding.inquire({
        vendorId: vendor.id,
        message,
        preferredDate: preferredDate || undefined,
        packageId: selected?.id,
        packageName: selected?.name,
      });
      setStatus(t("marketing.inquirySent"));
      setWhatsappUrl(inquiry.whatsappUrl);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not send inquiry");
    }
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!vendor) return;
    try {
      await api.vendors.review(vendor.id, { rating, body: reviewBody, recommended: true });
      setReviewBody("");
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("knotly.reviewHelp"));
    }
  }

  async function openInAppMessage() {
    if (!vendor) return;
    try {
      if (user?.role === "VENDOR") {
        const conversation = await api.messaging.openConversation({
          type: "VENDOR_VENDOR",
          vendorId: vendor.id,
        });
        router.push(`/pro/messages?c=${conversation.id}`);
        return;
      }
      const conversation = await api.messaging.openConversation({
        type: "COUPLE_VENDOR",
        vendorId: vendor.id,
      });
      router.push(`/planning/messages?c=${conversation.id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not open chat");
    }
  }

  async function saveToTeam() {
    if (!vendor) return;
    try {
      if (shortlisted) {
        await api.wedding.unshortlist(vendor.id);
        setShortlisted(false);
        setStatus("Removed from team");
      } else {
        await api.wedding.shortlist({ vendorId: vendor.id });
        setShortlisted(true);
        setStatus("Saved to your team");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not update team");
    }
  }

  if (!vendor) {
    return (
      <div className="grid gap-8">
        <div className="h-4 w-40 animate-pulse rounded-full bg-secondary" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-secondary" />
          <div className="grid gap-4">
            <div className="h-4 w-24 animate-pulse rounded-full bg-secondary" />
            <div className="h-10 w-2/3 animate-pulse rounded-full bg-secondary" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-secondary" />
            <div className="h-48 animate-pulse rounded-3xl bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vendor.city}, ${vendor.district}, Sri Lanka`)}`;
  const wa = vendor.whatsapp ? `https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}` : null;
  const canCouple = user && (user.role === "COUPLE" || user.role === "FAMILY");
  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: t("knotly.about") },
    { id: "faqs", label: t("knotly.faqs") },
    ...(reviewsEnabled ? [{ id: "reviews" as const, label: t("nav.reviews") }] : []),
    { id: "pricing", label: t("knotly.pricing") },
    { id: "location", label: t("knotly.location") },
  ];
  const startingLabel = formatVendorStartingPriceLabel(
    vendor,
    (value) => formatMoney(value, currency),
    t("knotly.inquirePricing"),
  );
  const websiteHref = normalizeVendorWebsiteUrl(vendor.websiteUrl);
  const websiteLabel = vendorWebsiteLabel(vendor.websiteUrl) || t("knotly.website");

  const categoryLabel =
    (typeMeta ? localizedText(typeMeta.label, locale) : null) ||
    CATEGORY_LABELS[vendor.category] ||
    vendor.category;

  const cinematic = vendor.galleryLayout ?? typeMeta?.galleryLayout ?? "default";
  const profileAttributes = vendor.attributes ?? [];
  const hasStyleAttribute = profileAttributes.some((chip) => chip.key === "style");

  return (
    <div className="grid gap-8 pb-24 lg:pb-0">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={catalogHref}
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("catalog.backToResults")}
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/vendors?category=${vendor.category}`}
          className="transition hover:text-foreground"
        >
          {categoryLabel}
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-foreground">{vendor.name}</span>
      </nav>
      {vendor.listed === false ? (
        <div className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm">
          <p className="font-medium">{t("knotly.unlistedTitle")}</p>
          <p className="mt-0.5 text-muted-foreground">{t("knotly.unlistedBody")}</p>
        </div>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <VendorGallery
          className="self-start"
          photos={photos}
          coverUrl={vendor.photoUrl}
          name={vendor.name}
          cinematic={cinematic}
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
        />
        <div className="grid gap-4 self-start lg:sticky lg:top-24">
          <VendorIdentity
            name={vendor.name}
            category={categoryLabel}
            location={`${vendor.city}, ${vendor.district}`}
            verified={vendor.verified}
            featured={vendor.featured}
            destination={vendor.destinationExperienced}
          />
          {profileAttributes.length ? (
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/50 p-4">
              {profileAttributes.map((group) => (
                <div key={group.key} className="grid gap-2">
                  <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {localizedText(group.label, locale)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options?.length ? (
                      group.options.map((option) => (
                        <Link
                          key={option.key}
                          href={attributeCatalogHref(vendor.category, group, option.key)}
                          className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-xs transition hover:border-primary hover:text-primary"
                        >
                          {localizedText(option.label, locale)}
                        </Link>
                      ))
                    ) : formatAttributeDisplay(group, locale) ? (
                      <Link
                        href={attributeCatalogHref(vendor.category, group)}
                        className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-xs transition hover:border-primary hover:text-primary"
                      >
                        {formatAttributeDisplay(group, locale)}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <VendorStatStrip
            rating={(vendor.ratingAvg ?? 4.8).toFixed(1)}
            couplesServed={vendor.couplesServed ?? 0}
            yearsExperience={vendor.yearsExperience ?? 0}
            couplesLabel={t("knotly.couplesServed")}
            yearsLabel={t("knotly.years")}
          />
          {vendor.offerHeadline ? (
            <p className="font-serif text-xl leading-snug tracking-tight text-foreground md:text-2xl">
              {vendor.offerHeadline}
            </p>
          ) : null}
          {vendor.showPricing === false ? (
            <div className="grid gap-1">
              <p className="text-lg font-medium text-primary">{startingLabel}</p>
              <p className="text-sm text-muted-foreground">{t("knotly.pricingHiddenBody")}</p>
            </div>
          ) : (
            <p className="text-lg font-medium text-primary">{startingLabel}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {canCouple ? <ShortlistControl saved={shortlisted} onToggle={saveToTeam} /> : null}
            {canCouple || user?.role === "VENDOR" ? (
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void openInAppMessage()}>
                <MessageCircle className="size-4" />
                {t("messaging.messageInApp")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant={hasCompare(vendor.slug) ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => {
                const result = toggleCompare({
                  id: vendor.id,
                  slug: vendor.slug,
                  name: vendor.name,
                  category: vendor.category,
                  photoUrl: vendor.photoUrl ?? vendor.photos?.[0],
                });
                setCompareHint(result.ok ? null : (result.reason ?? null));
              }}
            >
              <Scale className="size-4" />
              {hasCompare(vendor.slug) ? "In compare" : "Compare"}
            </Button>
            {compareHref ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={compareHref}>Open compare ({compareCount})</Link>
              </Button>
            ) : null}
            {vendor.instagram ? (
              <a
                className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-primary transition hover:border-primary/40"
                href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
            ) : null}
            {vendor.facebook ? (
              <a
                className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-primary transition hover:border-primary/40"
                href={
                  vendor.facebook.startsWith("http")
                    ? vendor.facebook
                    : `https://facebook.com/${vendor.facebook.replace(/^@/, "")}`
                }
                target="_blank"
                rel="noreferrer"
              >
                Facebook
              </a>
            ) : null}
            {websiteHref ? (
              <a
                className="rounded-full border border-border/70 px-3 py-1.5 text-sm text-primary transition hover:border-primary/40"
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
              >
                {websiteLabel}
              </a>
            ) : null}
          </div>
          {compareHint ? <p className="text-xs text-destructive">{compareHint}</p> : null}
          {features.length ? (
            <div className="grid gap-2 rounded-2xl border border-border/70 bg-card/50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("knotly.asSeenIn")}</p>
              {features.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/ideas/${article.slug}`}
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  {article.title}
                </Link>
              ))}
            </div>
          ) : null}
          <InquirePanel title={t("knotly.requestPricing")}>
            {canCouple ? (
              <form className="grid gap-3" onSubmit={inquire}>
                <FieldBlock label={t("knotly.preferredDate")} htmlFor="preferred" compact>
                  <DatePicker
                    value={preferredDate}
                    onChange={setPreferredDate}
                    placeholder={t("knotly.preferredDate")}
                  />
                </FieldBlock>
                <FieldBlock label={t("marketing.message")} htmlFor="message" compact>
                  <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
                </FieldBlock>
                {selectedPackageId ? (
                  <p className="text-xs text-muted-foreground">
                    Package: {vendor.packages?.find((pkg) => pkg.id === selectedPackageId)?.name}
                  </p>
                ) : null}
                <Button type="submit" className="w-full">
                  {t("hub.inquire")}
                </Button>
                {wa ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={wa} target="_blank" rel="noreferrer">
                      {t("knotly.whatsapp")}
                    </a>
                  </Button>
                ) : null}
                {status ? <FormStatus tone={status.includes("sent") || status.includes("Sent") ? "success" : "muted"}>{status}</FormStatus> : null}
                {whatsappUrl ? (
                  <Button asChild className="w-full">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      {t("knotly.openWhatsapp")}
                    </a>
                  </Button>
                ) : null}
              </form>
            ) : (
              <div className="grid gap-3 text-sm">
                <p className="text-muted-foreground">{t("marketing.loginToInquire")}</p>
                <Button asChild className="w-full">
                  <Link href="/login">{t("nav.signIn")}</Link>
                </Button>
                {wa ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={wa} target="_blank" rel="noreferrer">
                      {t("knotly.whatsapp")}
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </InquirePanel>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="grid gap-2">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <div className="grid gap-5 rounded-3xl border border-border/70 bg-card/60 p-6 text-sm shadow-sm md:p-8">
            <p className="max-w-3xl text-base leading-relaxed">{vendor.description}</p>
            {!hasStyleAttribute && vendor.styles?.length ? (
              <p className="text-muted-foreground">{vendor.styles.join(", ")}</p>
            ) : null}
            {vendor.destinationExperienced ? <Badge intent="info">Destination experienced</Badge> : null}
            {(vendor.serviceAreas ?? []).length ? (
              <p className="text-muted-foreground">Service areas: {(vendor.serviceAreas ?? []).join(", ")}</p>
            ) : null}
            {vendor.travelNote ? <p className="text-muted-foreground">{vendor.travelNote}</p> : null}
            {vendor.overtimeNote ? <p className="text-muted-foreground">Overtime: {vendor.overtimeNote}</p> : null}
            {(vendor.includedInPrice ?? []).length ? (
              <div>
                <p className="mb-2 font-medium">{t("knotly.included")}</p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {(vendor.includedInPrice ?? []).map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {vendor.taxNote || vendor.depositNote || vendor.cancellationNote ? (
              <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
                {vendor.taxNote ? <p>Tax: {vendor.taxNote}</p> : null}
                {vendor.depositNote ? <p>Deposit: {vendor.depositNote}</p> : null}
                {vendor.cancellationNote ? <p>Cancellation: {vendor.cancellationNote}</p> : null}
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="mt-4">
          <div className="grid gap-1 rounded-3xl border border-border/70 bg-card/60 p-4 text-sm shadow-sm md:p-6">
            {(vendor.faqs ?? []).map((faq, index) => (
              <details
                key={`${faq.question}-${index}`}
                className="group border-b border-border/50 py-3 last:border-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2 leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
            {(vendor.faqs ?? []).length === 0 ? <p className="p-2 text-muted-foreground">—</p> : null}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="grid gap-6 rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm md:p-8">
            <div>
              <p className="font-serif text-4xl font-semibold tracking-tight">★ {(vendor.ratingAvg ?? 0).toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                {vendor.ratingCount ?? 0} {t("knotly.recommended")}
              </p>
            </div>
            {averages
              ? DIMS.map((key) => (
                  <div key={key} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-xs">
                    <span>{t(`knotly.${key}`)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(averages[key] / 5) * 100}%` }}
                      />
                    </div>
                    <span>{averages[key].toFixed(1)}</span>
                  </div>
                ))
              : null}
            {(vendor.reviews ?? []).map((review) => (
              <div key={review.id} className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm">
                <p className="font-medium">
                  {review.authorName} · ★ {review.rating}
                </p>
                <p className="mt-1 text-muted-foreground">{review.body}</p>
              </div>
            ))}
            {canCouple ? (
              <form className="grid gap-3" onSubmit={submitReview}>
                <p className="font-medium">{t("knotly.writeReview")}</p>
                <FieldBlock label="Rating" compact>
                  <SimpleSelect
                    value={String(rating)}
                    onValueChange={(value) => setRating(Number(value))}
                    options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `★ ${value}` }))}
                  />
                </FieldBlock>
                <FieldBlock label="Review" compact>
                  <Textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    required
                    minLength={8}
                  />
                </FieldBlock>
                <Button type="submit">{t("planning.save")}</Button>
              </form>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <div className="grid gap-5">
            {vendor.showPricing === false ? (
              <div className="rounded-3xl border border-border/70 bg-card/60 p-5 md:p-6">
                <p className="font-serif text-2xl tracking-tight">{t("knotly.pricingHiddenTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("knotly.pricingHiddenBody")}</p>
              </div>
            ) : vendor.offerHeadline ? (
              <p className="font-serif text-2xl tracking-tight md:text-3xl">{vendor.offerHeadline}</p>
            ) : null}
            <PackageCompare packages={packageCards} onSelect={setSelectedPackageId} />
            {(vendor.packages ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{startingLabel}</p>
            ) : null}
            {vendor.pricingDisclaimer ? (
              <p className="text-xs text-muted-foreground">{vendor.pricingDisclaimer}</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
          <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/60 p-6 text-sm shadow-sm md:p-8">
            <p className="font-serif text-xl tracking-tight">
              {vendor.city}, {vendor.district}
            </p>
            <Button asChild variant="outline" className="w-fit">
              <a href={maps} target="_blank" rel="noreferrer">
                {t("knotly.seeMap")}
              </a>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          {canCouple ? <ShortlistControl saved={shortlisted} onToggle={saveToTeam} className="shrink-0" /> : null}
          {wa ? (
            <Button asChild className="flex-1">
              <a href={wa} target="_blank" rel="noreferrer">
                {t("knotly.whatsapp")}
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              onClick={() => document.getElementById("preferred")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              {t("hub.inquire")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
