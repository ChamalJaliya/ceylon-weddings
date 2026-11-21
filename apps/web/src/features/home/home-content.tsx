"use client";

import { Heart, MapPin, Sparkles, Star, MessageCircle, ArrowRight, Users, Shield } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { CoupleHero } from "@ceylonweddings/ui/domain/couple-hero";
import { VendorCard } from "@ceylonweddings/ui/domain/vendor-card";
import { VendorQuickView } from "@ceylonweddings/ui/domain/vendor-quick-view";
import { toQuickView } from "@/lib/vendor-quick-view";
import { useState } from "react";
import { Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import type { PublicSiteConfig, Vendor } from "@ceylonweddings/contracts";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS, priceLabel } from "@/lib/labels";
import { PromotionSlotRail } from "@/components/promotion-slot-rail";
import { WEDDING_IMAGES } from "@/lib/wedding-images";
import { CATEGORY_ICONS } from "@/lib/category-media";
import {
  CategoryShowcase,
  FinalCta,
  HeroStats,
  HowItWorksTimeline,
  MomentsGallery,
  PlacesMarquee,
  SectionHeading,
  ToolsShowcase,
} from "./home-sections";

const HERO_GALLERY: readonly string[] = WEDDING_IMAGES;

const STAT_ICONS = [Shield, Users, Star, MapPin];
const HOW_ICONS = [Heart, Sparkles, MessageCircle];

type BrowseCategory = {
  key: string;
  label: string;
};

type HomeCopy = {
  kicker: string;
  tagline: string;
  ceylonPicks: string;
  suggestedVendors: string;
  viewAll: string;
  marketingSub: string;
  inquirePricing: string;
};

export function HomeContent({
  homepage,
  adsEnabled,
  vendors,
  browseCategories,
  typeLabelBySlug,
  copy,
}: {
  homepage: PublicSiteConfig["homepage"];
  adsEnabled: boolean;
  vendors: Vendor[];
  browseCategories: BrowseCategory[];
  typeLabelBySlug: Record<string, string>;
  copy: HomeCopy;
}) {
  const [quickId, setQuickId] = useState<string | null>(null);
  const quick = vendors.find((vendor) => vendor.id === quickId) ?? null;
  const categoryFor = (vendor: Vendor) =>
    typeLabelBySlug[vendor.category] ?? CATEGORY_LABELS[vendor.category] ?? vendor.category;
  const priceFor = (vendor: Vendor) =>
    priceLabel(vendor.startingPriceLkr, "LKR", vendor.priceDisplayMode, vendor.showPricing, copy.inquirePricing);

  return (
    <>
      <CoupleHero
        imageSrc={HERO_GALLERY[0] ?? homepage.hero.imageUrl}
        images={[...HERO_GALLERY]}
        imageAlt="Sri Lankan wedding"
        kicker={copy.kicker}
        names={homepage.hero.title}
        date={homepage.hero.subtitle || copy.tagline}
        chips={homepage.hero.chips}
        actions={
          <>
            <Button asChild shape="pill" size="lg">
              <Link href={homepage.hero.ctaPrimaryHref}>{homepage.hero.ctaPrimaryLabel}</Link>
            </Button>
            <Button
              asChild
              shape="pill"
              size="lg"
              variant="outline"
              className="border-hero-foreground/35 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
            >
              <Link href={homepage.hero.ctaSecondaryHref}>{homepage.hero.ctaSecondaryLabel}</Link>
            </Button>
          </>
        }
        footer={<HeroStats stats={homepage.stats} icons={STAT_ICONS} />}
      />

      {adsEnabled ? (
        <div className="mx-auto w-full max-w-6xl px-6 pt-10 pb-12 sm:pb-16">
          <PromotionSlotRail slot="HOME_HERO" limit={1} />
        </div>
      ) : null}

      <PlacesMarquee />

      <div className="mx-auto grid w-full max-w-6xl gap-24 px-6 py-20 sm:gap-32">
        <section>
          <SectionHeading
            eyebrow="Marketplace"
            title="Browse by category"
            action={
              <Button asChild variant="ghost" shape="pill">
                <Link href="/vendors" className="inline-flex items-center gap-1.5">
                  View all vendors <Icon icon={ArrowRight} size="xs" lottie={false} />
                </Link>
              </Button>
            }
          />
          <CategoryShowcase categories={browseCategories} icons={CATEGORY_ICONS} />
        </section>

        {vendors.length > 0 ? (
          <section>
            <SectionHeading
              eyebrow={copy.ceylonPicks}
              title={copy.suggestedVendors}
              action={
                <Button asChild variant="ghost" shape="pill">
                  <Link href="/vendors" className="inline-flex items-center gap-1.5">
                    {copy.viewAll} <Icon icon={ArrowRight} size="xs" lottie={false} />
                  </Link>
                </Button>
              }
            />
            {adsEnabled ? (
              <div className="mb-6">
                <PromotionSlotRail slot="HOME_PICKS" limit={2} />
              </div>
            ) : null}
            <Stagger className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3" stagger={0.06}>
              {vendors.map((vendor) => (
                <StaggerItem key={vendor.id} className="h-full">
                  <VendorCard
                    href={`/vendors/${vendor.slug}`}
                    linkAs={Link}
                    name={vendor.name}
                    category={categoryFor(vendor)}
                    location={`${vendor.city}, ${vendor.district}`}
                    priceBand={priceFor(vendor)}
                    imageSrc={vendor.photoUrl}
                    photos={vendor.photos}
                    rating={vendor.ratingAvg}
                    ratingCount={vendor.ratingCount}
                    verified={vendor.verified}
                    featured={vendor.featured}
                    onQuickView={() => setQuickId(vendor.id)}
                  />
                </StaggerItem>
              ))}
            </Stagger>
            <VendorQuickView
              open={Boolean(quick)}
              onOpenChange={(open) => !open && setQuickId(null)}
              linkAs={Link}
              vendor={quick ? toQuickView(quick, categoryFor(quick), priceFor(quick)) : null}
            />
          </section>
        ) : null}

        <MomentsGallery />

        <HowItWorksTimeline steps={homepage.howItWorks} icons={HOW_ICONS} sub={copy.marketingSub} />

        <ToolsShowcase ctaLabel={homepage.hero.ctaSecondaryLabel} />

        <FinalCta
          primary={{ href: homepage.hero.ctaPrimaryHref, label: homepage.hero.ctaPrimaryLabel }}
          secondary={{ href: homepage.hero.ctaSecondaryHref, label: homepage.hero.ctaSecondaryLabel }}
        />
      </div>
    </>
  );
}
