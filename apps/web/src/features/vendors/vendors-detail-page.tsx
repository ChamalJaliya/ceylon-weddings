"use client";

import {
  type Article,
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
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  api,
  formatMoney,
  readCatalogHref,
  useAuthStore,
  useCompareStore,
  usePreferenceStore,
} from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { ShortlistControl } from "@ceylonweddings/ui/domain/shortlist-control";
import { VendorGallery } from "@ceylonweddings/ui/domain/vendor-gallery";
import { Link, useRouter } from "@/i18n/navigation";
import { CATEGORY_LABELS, formatAttributeDisplay, localizedText } from "@/lib/labels";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarX,
  Car,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Receipt,
  Scale,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { SafeImg } from "@/components/safe-img";
import {
  FaqList,
  InquiryStepper,
  ProjectStories,
  InfoTabs,
  ReviewCarousel,
  SectionNav,
  SimilarVendors,
  StorySection,
  TrustBadges,
  VendorStickyBar,
} from "./vendor-story";
import { cn } from "@ceylonweddings/ui/utils";

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

const DIMS = ["quality", "professionalism", "flexibility", "responseTime", "value", "communication"] as const;

export default function VendorStorefrontPage() {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const currency = usePreferenceStore((state) => state.currency);
  const user = useAuthStore((state) => state.user);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [typeMeta, setTypeMeta] = useState<PublicVendorTypeListItem | null>(null);
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
  const [features, setFeatures] = useState<Article[]>([]);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [album, setAlbum] = useState<string | undefined>(undefined);
  const heroRef = useRef<HTMLDivElement>(null);
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
    api
      .vendorTypes()
      .then((list) => setTypeMeta(list.find((item) => item.slug === next.category) ?? null))
      .catch(() => setTypeMeta(null));
    api.public
      .articles(undefined, undefined, next.slug)
      .then(setFeatures)
      .catch(() => setFeatures([]));
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
    const avg = (key: (typeof DIMS)[number]) => reviews.reduce((sum, review) => sum + review[key], 0) / reviews.length;
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
        <div className="cw-shimmer min-h-80 rounded-3xl bg-muted sm:min-h-96" />

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
  // Feeds the vendor's "WhatsApp taps" dashboard widget (fire and forget).
  const trackWhatsapp = () => void api.vendors.trackWhatsappTap(vendor.id);
  const canCouple = user && (user.role === "COUPLE" || user.role === "FAMILY");
  const startingLabel = formatVendorStartingPriceLabel(
    vendor,
    (value) => formatMoney(value, currency),
    t("knotly.inquirePricing"),
  );
  const websiteHref = normalizeVendorWebsiteUrl(vendor.websiteUrl);
  const websiteLabel = vendorWebsiteLabel(vendor.websiteUrl) || t("knotly.website");

  const categoryLabel =
    (typeMeta ? localizedText(typeMeta.label, locale) : null) || CATEGORY_LABELS[vendor.category] || vendor.category;

  const cinematic = vendor.galleryLayout ?? typeMeta?.galleryLayout ?? "default";
  const profileAttributes = vendor.attributes ?? [];
  const hasStyleAttribute = profileAttributes.some((chip) => chip.key === "style");

  const sections = [
    { id: "packages", label: "Packages" },
    { id: "about", label: t("knotly.about") },
    { id: "work", label: "Work" },
    ...(reviewsEnabled ? [{ id: "reviews", label: t("nav.reviews") }] : []),
    { id: "info", label: "Info" },
  ];
  const mosaic = [vendor.photoUrl, ...photos]
    .filter((src, i, arr): src is string => Boolean(src) && arr.indexOf(src) === i)
    .slice(0, 5);
  const projects = (vendor.mediaProjects ?? []).map((project) => ({
    id: project.id,
    title: project.title,
    coverUrl: project.coverUrl,
    items: project.items ?? [],
  }));
  const avatar = vendor.photoUrl ?? photos[0] ?? null;
  const detailRows = [
    (vendor.serviceAreas ?? []).length
      ? { icon: MapPin, label: "Service areas", value: (vendor.serviceAreas ?? []).join(", ") }
      : null,
    vendor.travelNote ? { icon: Car, label: "Travel", value: vendor.travelNote } : null,
    vendor.overtimeNote ? { icon: Clock, label: "Overtime", value: vendor.overtimeNote } : null,
    vendor.depositNote ? { icon: Wallet, label: "Deposit", value: vendor.depositNote } : null,
    vendor.taxNote ? { icon: Receipt, label: "Tax", value: vendor.taxNote } : null,
    vendor.cancellationNote ? { icon: CalendarX, label: "Cancellation", value: vendor.cancellationNote } : null,
  ].filter((row): row is { icon: typeof MapPin; label: string; value: string } => Boolean(row));

  async function sendInquiry(guests: string) {
    if (!vendor) return false;
    try {
      const selected = vendor.packages?.find((pkg) => pkg.id === selectedPackageId);
      const inquiry = await api.wedding.inquire({
        vendorId: vendor.id,
        message: guests ? `${message}\n\nGuest count: ~${guests}` : message,
        preferredDate: preferredDate || undefined,
        packageId: selected?.id,
        packageName: selected?.name,
      });
      setStatus(t("marketing.inquirySent"));
      setWhatsappUrl(inquiry.whatsappUrl);
      return true;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not send inquiry");
      return false;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-28 sm:gap-8 lg:pb-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={catalogHref}
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {t("catalog.backToResults")}
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/vendors?category=${vendor.category}`} className="transition hover:text-foreground">
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

      <VendorStickyBar
        watch={heroRef}
        name={vendor.name}
        photo={avatar}
        rating={vendor.ratingAvg}
        price={startingLabel}
        saved={shortlisted}
        onSave={canCouple ? () => void saveToTeam() : undefined}
      />

      {/* 1 · Bold editorial hero */}
      <div ref={heroRef}>
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate grid overflow-hidden rounded-3xl bg-ink text-paper shadow-raised lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 -z-10 size-96 rounded-full bg-primary/40 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-80 rounded-full bg-love/25 blur-3xl"
          />
          <div className="order-2 grid content-center gap-5 p-6 sm:p-10 lg:order-1">
            <div className="flex items-center gap-3">
              {avatar ? (
                <SafeImg src={avatar} className="size-12 rounded-2xl object-cover ring-2 ring-paper/20" />
              ) : null}
              <div>
                <p className="text-label tracking-eyebrow text-paper/60 uppercase">{categoryLabel}</p>
                <p className="flex items-center gap-1.5 text-sm text-paper/80">
                  <MapPin className="size-3.5" /> {vendor.city}, {vendor.district}
                </p>
              </div>
            </div>
            <h1 className="font-serif text-4xl leading-none font-medium tracking-tight text-balance sm:text-6xl">
              {vendor.name}
              {vendor.verified ? (
                <BadgeCheck
                  className="ml-2 inline size-7 align-baseline text-primary sm:size-9"
                  aria-label="Verified"
                />
              ) : null}
            </h1>
            {(vendor.offerHeadline ?? vendor.description) ? (
              <p className="max-w-lg text-base leading-relaxed text-paper/75">
                {vendor.offerHeadline ?? vendor.description?.split(". ")[0]}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {vendor.ratingAvg ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5">
                  <Star className="size-3.5 fill-paper text-paper" /> {vendor.ratingAvg.toFixed(1)}
                  <span className="text-paper/60">· {vendor.ratingCount ?? 0} reviews</span>
                </span>
              ) : null}
              {vendor.featured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-love px-3 py-1.5 text-love-foreground">
                  <Sparkles className="size-3.5" /> Featured
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-paper/10 pt-5">
              <div>
                <p className="text-xs text-paper/60">Starting at</p>
                <p className="font-serif text-3xl sm:text-4xl">{startingLabel}</p>
              </div>
              <div className="flex flex-1 flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  shape="pill"
                  size="lg"
                  className="group"
                  onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <span className="inline-flex items-center gap-2">
                    View packages <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
                {wa ? (
                  <Button
                    asChild
                    shape="pill"
                    size="lg"
                    variant="outline"
                    className="border-paper/30 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
                  >
                    <a href={wa} target="_blank" rel="noreferrer" onClick={trackWhatsapp}>
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Photo mosaic */}
          <div className="order-1 grid h-56 grid-cols-3 grid-rows-2 gap-1.5 p-1.5 sm:h-72 lg:order-2 lg:h-auto lg:min-h-[26rem]">
            {mosaic.map((src, index) => (
              <motion.button
                key={`${src}-${index}`}
                type="button"
                onClick={() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-paper/5",
                  index === 0 ? "col-span-2 row-span-2" : "",
                )}
                aria-label="View portfolio"
              >
                <SafeImg
                  src={src}
                  fallbackIndex={index}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {index === mosaic.length - 1 && photos.length > mosaic.length ? (
                  <span className="absolute inset-0 grid place-items-center bg-ink/55 text-sm text-paper backdrop-blur-[2px]">
                    +{photos.length - mosaic.length} photos
                  </span>
                ) : null}
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>

      {/* 3 · Trust */}
      <TrustBadges vendor={vendor} />

      {/* 2 · Story */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div className="grid min-w-0 grid-cols-1 content-start gap-12 sm:gap-14">
          <SectionNav sections={sections} />

          <StorySection id="packages" eyebrow={t("knotly.pricing")} title="Packages">
            {vendor.showPricing === false ? (
              <p className="mb-4 text-sm text-muted-foreground">{t("knotly.pricingHiddenBody")}</p>
            ) : null}
            {packageCards.length ? (
              <Stagger className="grid gap-4 sm:grid-cols-2" stagger={0.07}>
                {packageCards.map((pack, index) => {
                  const bold =
                    pack.badge === "POPULAR" || (index === 1 && !packageCards.some((p) => p.badge === "POPULAR"));
                  return (
                    <StaggerItem key={pack.id} className="h-full">
                      <motion.div
                        whileHover={reduce ? undefined : { y: -6 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                        className={cn(
                          "relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-6 shadow-card",
                          bold ? "bg-ink text-paper shadow-raised" : "border border-border bg-card",
                          pack.selected && !bold && "ring-2 ring-primary",
                        )}
                      >
                        {bold ? (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/40 blur-3xl"
                          />
                        ) : null}
                        <div className="relative flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={cn(
                                "text-label tracking-eyebrow uppercase",
                                bold ? "text-paper/60" : "text-muted-foreground",
                              )}
                            >
                              {pack.bestFor ?? "Package"}
                            </p>
                            <h3 className="mt-1 font-serif text-2xl">{pack.name}</h3>
                          </div>
                          {pack.badge ? (
                            <span className="shrink-0 rounded-full bg-love px-2.5 py-1 text-xs text-love-foreground capitalize">
                              {pack.badge.replaceAll("_", " ").toLowerCase()}
                            </span>
                          ) : null}
                        </div>
                        <p className={cn("relative font-serif text-3xl", bold ? "text-paper" : "text-primary")}>
                          {pack.priceLabel}
                        </p>
                        {pack.inclusions?.length ? (
                          <ul className="relative grid gap-2 text-sm">
                            {pack.inclusions.slice(0, 4).map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <Check
                                  className={cn("mt-0.5 size-4 shrink-0", bold ? "text-primary" : "text-primary")}
                                />
                                <span className={bold ? "text-paper/85" : undefined}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : pack.description ? (
                          <p className={cn("relative text-sm", bold ? "text-paper/75" : "text-muted-foreground")}>
                            {pack.description}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          shape="pill"
                          variant={bold ? "default" : "outline"}
                          className="group relative mt-auto w-full"
                          onClick={() => {
                            setSelectedPackageId(pack.id);
                            document.getElementById("inquire")?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            Choose & inquire
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </Button>
                      </motion.div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            ) : (
              <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Packages coming soon. Send an inquiry for a tailored quote.
              </p>
            )}
            {vendor.pricingDisclaimer ? (
              <p className="mt-3 text-xs text-muted-foreground">{vendor.pricingDisclaimer}</p>
            ) : null}
          </StorySection>

          <StorySection id="about" eyebrow={t("knotly.about")} title={`About ${vendor.name}`}>
            <div className="grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-card">
              <p className="text-base leading-relaxed">{vendor.description}</p>
              {profileAttributes.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {profileAttributes.map((group) => (
                    <div key={group.key} className="grid content-start gap-2">
                      <p className="text-label tracking-eyebrow text-muted-foreground uppercase">
                        {localizedText(group.label, locale)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.options?.length ? (
                          group.options.map((option) => (
                            <Link
                              key={option.key}
                              href={attributeCatalogHref(vendor.category, group, option.key)}
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground"
                            >
                              {localizedText(option.label, locale)}
                            </Link>
                          ))
                        ) : formatAttributeDisplay(group, locale) ? (
                          <Link
                            href={attributeCatalogHref(vendor.category, group)}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground"
                          >
                            {formatAttributeDisplay(group, locale)}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasStyleAttribute && vendor.styles?.length ? (
                <div className="flex flex-wrap gap-2">
                  {vendor.styles.map((style) => (
                    <span key={style} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary capitalize">
                      {style}
                    </span>
                  ))}
                </div>
              ) : null}
              {(vendor.includedInPrice ?? []).length ? (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <span className="mr-1 self-center text-label tracking-eyebrow text-muted-foreground uppercase">
                    {t("knotly.included")}
                  </span>
                  {(vendor.includedInPrice ?? []).map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs ring-1 ring-border"
                    >
                      <Check className="size-3 text-primary" /> {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </StorySection>

          <StorySection id="work" eyebrow="Portfolio" title="Signature work">
            <VendorGallery
              photos={photos}
              coverUrl={vendor.photoUrl}
              name={vendor.name}
              cinematic={cinematic}
              album={album}
              projects={projects}
              introVideoUrl={vendor.introVideoUrl}
              videos={(vendor.videos ?? []).map((video) => ({ id: video.id, url: video.url, title: video.title }))}
            />
            <ProjectStories
              projects={projects}
              onOpen={(id) => {
                setAlbum(id);
                document.getElementById("work")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </StorySection>

          {reviewsEnabled ? (
            <StorySection id="reviews" eyebrow={t("nav.reviews")} title="What couples say">
              <div className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)]">
                <Reveal className="grid content-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div>
                    <p className="font-serif text-6xl leading-none">{(vendor.ratingAvg ?? 0).toFixed(1)}</p>
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i < Math.round(vendor.ratingAvg ?? 0) ? "fill-primary text-primary" : "text-border",
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vendor.ratingCount ?? 0} {t("knotly.recommended")}
                    </p>
                  </div>
                  {averages
                    ? DIMS.map((key) => (
                        <div key={key} className="grid gap-1 text-xs">
                          <div className="flex justify-between">
                            <span>{t(`knotly.${key}`)}</span>
                            <span className="text-muted-foreground">{averages[key].toFixed(1)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(averages[key] / 5) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-love"
                            />
                          </div>
                        </div>
                      ))
                    : null}
                </Reveal>
                <div className="grid content-start gap-4">
                  <ReviewCarousel reviews={vendor.reviews ?? []} />
                  {(vendor.reviews ?? []).length === 0 ? (
                    <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                      No reviews yet. Be the first couple to share your experience.
                    </p>
                  ) : null}
                  {canCouple ? (
                    <form
                      className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-card"
                      onSubmit={submitReview}
                    >
                      <p className="font-medium">{t("knotly.writeReview")}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <motion.button
                            key={value}
                            type="button"
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.15 }}
                            aria-label={`${value} stars`}
                            onClick={() => setRating(value)}
                          >
                            <Star
                              className={cn("size-6", value <= rating ? "fill-primary text-primary" : "text-border")}
                            />
                          </motion.button>
                        ))}
                      </div>
                      <Textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        required
                        minLength={8}
                        placeholder="How was your experience?"
                      />
                      <Button type="submit" shape="pill" className="w-fit">
                        {t("planning.save")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </StorySection>
          ) : null}

          <StorySection id="info" eyebrow="Good to know" title="Details, FAQs & location">
            <InfoTabs
              tabs={[
                ...(detailRows.length
                  ? [
                      {
                        id: "details",
                        label: "Details",
                        content: (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {detailRows.map((row) => (
                              <div
                                key={row.label}
                                className="flex items-start gap-3 rounded-2xl bg-background p-3 ring-1 ring-border"
                              >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                  <row.icon className="size-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-label tracking-eyebrow text-muted-foreground uppercase">
                                    {row.label}
                                  </p>
                                  <p className="mt-0.5 text-sm">{row.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                    ]
                  : []),
                { id: "faqs", label: t("knotly.faqs"), content: <FaqList faqs={vendor.faqs ?? []} /> },
                {
                  id: "location",
                  label: t("knotly.location"),
                  content: (
                    <div className="grid gap-3">
                      <iframe
                        title={`${vendor.city} map`}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(`${vendor.city}, ${vendor.district}, Sri Lanka`)}&output=embed`}
                        className="h-64 w-full rounded-2xl"
                        loading="lazy"
                      />
                      <Button asChild variant="outline" shape="pill" className="w-fit">
                        <a href={maps} target="_blank" rel="noreferrer">
                          {t("knotly.seeMap")}
                        </a>
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </StorySection>
        </div>

        {/* Booking card */}
        <motion.aside
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="grid content-start gap-4 self-start lg:sticky lg:top-40"
        >
          <div
            id="inquire"
            className="scroll-mt-32 overflow-hidden rounded-3xl border border-border bg-card shadow-raised"
          >
            <div className="border-b border-border bg-primary/5 p-5">
              <p className="text-xs text-muted-foreground">Starting at</p>
              <p className="font-serif text-3xl text-primary">{startingLabel}</p>
              {vendor.showPricing === false ? (
                <p className="mt-1 text-xs text-muted-foreground">{t("knotly.pricingHiddenBody")}</p>
              ) : null}
            </div>
            <div className="grid gap-4 p-5">
              <p className="font-serif text-xl">{t("knotly.requestPricing")}</p>
              {canCouple ? (
                <InquiryStepper
                  packages={packageCards.map((pack) => ({ id: pack.id, name: pack.name, priceLabel: pack.priceLabel }))}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={setSelectedPackageId}
                  preferredDate={preferredDate}
                  setPreferredDate={setPreferredDate}
                  message={message}
                  setMessage={setMessage}
                  onSubmit={sendInquiry}
                  status={status}
                  whatsappUrl={whatsappUrl}
                  fallbackWhatsapp={wa}
                  onWhatsapp={trackWhatsapp}
                />
              ) : (
                <div className="grid gap-3 text-sm">
                  <p className="text-muted-foreground">{t("marketing.loginToInquire")}</p>
                  <Button asChild shape="pill" className="w-full">
                    <Link href="/login">{t("nav.signIn")}</Link>
                  </Button>
                </div>
              )}
              {wa ? (
                <Button asChild variant="outline" shape="pill" className="w-full">
                  <a href={wa} target="_blank" rel="noreferrer" onClick={trackWhatsapp}>
                    <MessageCircle className="size-4" /> {t("knotly.whatsapp")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canCouple ? <ShortlistControl saved={shortlisted} onToggle={saveToTeam} /> : null}
            {canCouple || user?.role === "VENDOR" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                shape="pill"
                className="gap-2"
                onClick={() => void openInAppMessage()}
              >
                <MessageCircle className="size-4" />
                {t("messaging.messageInApp")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant={hasCompare(vendor.slug) ? "default" : "outline"}
              size="sm"
              shape="pill"
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
              <Button asChild size="sm" variant="secondary" shape="pill">
                <Link href={compareHref}>Open compare ({compareCount})</Link>
              </Button>
            ) : null}
            {[
              vendor.instagram
                ? { label: "Instagram", href: `https://instagram.com/${vendor.instagram.replace("@", "")}` }
                : null,
              vendor.facebook
                ? {
                    label: "Facebook",
                    href: vendor.facebook.startsWith("http")
                      ? vendor.facebook
                      : `https://facebook.com/${vendor.facebook.replace(/^@/, "")}`,
                  }
                : null,
              websiteHref ? { label: websiteLabel, href: websiteHref } : null,
            ]
              .filter((link): link is { label: string; href: string } => Boolean(link))
              .map((link) => (
                <a
                  key={link.label}
                  className="inline-flex h-8 items-center rounded-full border border-border px-3 text-sm text-primary transition hover:border-primary/40"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
          </div>
          {compareHint ? <p className="text-xs text-destructive">{compareHint}</p> : null}

          {features.length ? (
            <div className="grid gap-2 rounded-3xl border border-border bg-card p-4 shadow-card">
              <p className="text-label tracking-eyebrow text-muted-foreground uppercase">{t("knotly.asSeenIn")}</p>
              {features.slice(0, 3).map((article, index) => (
                <Link
                  key={article.id}
                  href={`/ideas/${article.slug}`}
                  className="group flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-secondary/60"
                >
                  <SafeImg
                    src={article.coverUrl}
                    fallbackIndex={index}
                    className="size-12 shrink-0 rounded-xl object-cover"
                  />
                  <span className="line-clamp-2 text-sm group-hover:text-primary">{article.title}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </motion.aside>
      </div>

      {/* 5 · Similar vendors */}
      <SimilarVendors vendor={vendor} currency={currency} inquireLabel={t("knotly.inquirePricing")} />

      <motion.div
        initial={reduce ? false : { y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 28 }}
        className="fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-border bg-background/85 p-2.5 shadow-raised backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="min-w-0 flex-1 pl-2">
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="truncate font-serif text-lg text-primary">{startingLabel}</p>
          </div>
          {canCouple ? <ShortlistControl saved={shortlisted} onToggle={saveToTeam} className="shrink-0" /> : null}
          <Button
            type="button"
            shape="pill"
            className="shrink-0"
            onClick={() => document.getElementById("inquire")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            {t("hub.inquire")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
