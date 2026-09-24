"use client";

import {
  Heart,
  MapPin,
  Sparkles,
  Star,
  MessageCircle,
  ArrowRight,
  Users,
  Shield,
  Landmark,
  Camera,
  Flower2,
  UtensilsCrossed,
  Palette,
  Shirt,
  CakeSlice,
  Car,
  Music,
  Gem,
  MoonStar,
  Mail,
  ClipboardList,
  Scale,
  Leaf,
  Bus,
  Hotel,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Heading } from "@ceylonweddings/ui/components/heading";
import { AnimateIcon, Icon } from "@ceylonweddings/ui/components/icon";
import { CoupleHero } from "@ceylonweddings/ui/domain/couple-hero";
import { VendorCard } from "@ceylonweddings/ui/domain/vendor-card";
import { Reveal, Stagger, StaggerItem, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import type { PublicSiteConfig, Vendor } from "@ceylonweddings/contracts";
import { Link } from "../../i18n/navigation";
import { CATEGORY_LABELS, priceLabel } from "../../lib/labels";
import { PromotionSlotRail } from "../../components/promotion-slot-rail";

const HERO_GALLERY = [
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=2000&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=2000&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fe3c6f?w=2000&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=2000&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=2000&q=80",
];

function uniqueHeroImages(primary: string) {
  const seen = new Set<string>();
  return [primary, ...HERO_GALLERY].filter((src) => {
    const id = src.split("?")[0] ?? src;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
const STAT_ICONS = [Shield, Users, Star, MapPin];
const HOW_ICONS = [Heart, Sparkles, MessageCircle];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  VENUE: Landmark,
  PHOTO_VIDEO: Camera,
  FLORIST_DECOR: Flower2,
  CATERER: UtensilsCrossed,
  PORUWA: Sparkles,
  HAIR_MAKEUP: Palette,
  BRIDAL_WEAR: Shirt,
  GROOM_WEAR: Shirt,
  JEWELLERY: Gem,
  BRIDAL_DRESSER: Sparkles,
  CAKE: CakeSlice,
  ENTERTAINMENT: Music,
  ASTROLOGY: MoonStar,
  WEDDING_CARS: Car,
  INVITATIONS: Mail,
  PLANNER: ClipboardList,
  REGISTRAR: Scale,
  MEHNDI: Leaf,
  TRANSPORT: Bus,
  ACCOMMODATION: Hotel,
};

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
  const reduce = useReducedMotion();

  return (
    <>
      <CoupleHero
        imageSrc={homepage.hero.imageUrl}
        images={uniqueHeroImages(homepage.hero.imageUrl)}
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
        footer={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {homepage.stats.map(({ value, label }, index) => {
              const StatIcon = STAT_ICONS[index % STAT_ICONS.length] ?? Shield;
              return (
                <motion.div
                  key={label}
                  className="group cursor-default rounded-2xl border border-hero-foreground/15 bg-hero-foreground/[0.07] p-4 backdrop-blur-md transition-colors duration-300 hover:border-primary/50 hover:bg-hero-foreground/12"
                  whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hero-foreground/10 text-hero-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon icon={StatIcon} size="sm" lottie={false} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-serif text-2xl leading-none text-hero-foreground sm:text-3xl">{value}</p>
                      <p className="mt-1.5 text-[10px] tracking-[0.18em] text-hero-muted uppercase">{label}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        }
      />

      {adsEnabled ? (
        <div className="mx-auto w-full max-w-6xl px-6 pt-10">
          <PromotionSlotRail slot="HOME_HERO" limit={1} />
        </div>
      ) : null}

      <div className="mx-auto grid w-full max-w-6xl gap-20 px-6 py-16">
        <section>
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Marketplace
              </p>
              <Heading as="h2" icon={Sparkles} className="text-3xl font-semibold sm:text-4xl md:text-4xl">
                Browse by category
              </Heading>
            </div>
            <Button asChild variant="ghost" shape="pill">
              <Link href="/vendors" className="inline-flex items-center gap-1.5">
                View all vendors <Icon icon={ArrowRight} size="xs" lottie={false} />
              </Link>
            </Button>
          </Reveal>
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" stagger={0.04}>
            {browseCategories.map(({ key, label }) => {
              const CategoryIcon = CATEGORY_ICONS[key] ?? Sparkles;
              return (
                <StaggerItem key={key}>
                  <Link
                    href={`/vendors?category=${key}`}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-5 text-center shadow-card transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon icon={CategoryIcon} size="md" lottie={false} />
                    </span>
                    <span className="text-xs font-medium leading-tight text-foreground group-hover:text-primary">
                      {label}
                    </span>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        {vendors.length > 0 ? (
          <section>
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  {copy.ceylonPicks}
                </p>
                <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {copy.suggestedVendors}
                </h2>
              </div>
              <Button asChild variant="ghost" shape="pill">
                <Link href="/vendors" className="inline-flex items-center gap-1.5">
                  {copy.viewAll} <Icon icon={ArrowRight} size="xs" lottie={false} />
                </Link>
              </Button>
            </Reveal>
            {adsEnabled ? (
              <div className="mb-6">
                <PromotionSlotRail slot="HOME_PICKS" limit={2} />
              </div>
            ) : null}
            <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" stagger={0.06}>
              {vendors.map((vendor) => (
                <StaggerItem key={vendor.id}>
                  <Link href={`/vendors/${vendor.slug}`} className="block h-full">
                    <VendorCard
                      name={vendor.name}
                      category={
                        typeLabelBySlug[vendor.category] ??
                        CATEGORY_LABELS[vendor.category] ??
                        vendor.category
                      }
                      location={`${vendor.city}, ${vendor.district}`}
                      priceBand={priceLabel(
                        vendor.startingPriceLkr,
                        "LKR",
                        vendor.priceDisplayMode,
                        vendor.showPricing,
                        copy.inquirePricing,
                      )}
                      imageSrc={vendor.photoUrl}
                      photos={vendor.photos}
                      rating={vendor.ratingAvg}
                      ratingCount={vendor.ratingCount}
                      verified={vendor.verified}
                      featured={vendor.featured}
                    />
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ) : null}

        <section>
          <Reveal className="mb-10 text-center">
            <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              How it works
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Plan your wedding in three steps
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {copy.marketingSub}
            </p>
          </Reveal>
          <Stagger className="grid gap-6 md:grid-cols-3" stagger={0.08}>
            {homepage.howItWorks.map((step, index) => {
              const StepIcon = HOW_ICONS[index % HOW_ICONS.length] ?? Heart;
              const stepNumber = String(index + 1).padStart(2, "0");
              return (
                <StaggerItem key={step.title}>
                  <AnimateIcon animateOnHover animateOnView asChild>
                    <div className="group relative rounded-3xl border border-border bg-card px-6 py-8 shadow-card transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-md">
                      <p className="mb-4 font-serif text-5xl font-semibold text-primary/20 transition-colors duration-300 group-hover:text-primary/30">
                        {stepNumber}
                      </p>
                      <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                        <Icon icon={StepIcon} size="md" lottie={false} />
                      </div>
                      <h3 className="mb-2 font-serif text-lg font-semibold">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </AnimateIcon>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>

        <Reveal className="overflow-hidden rounded-3xl bg-primary/5 ring-1 ring-primary/15">
          <div className="grid items-center gap-0 md:grid-cols-2">
            <div className="px-8 py-12 md:px-12">
              <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-primary uppercase">
                Free planning tools
              </p>
              <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Checklist, budget & guests — ready for Sri Lankan weddings
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Create your wedding profile, invite family, and keep every poruwa, church, and homecoming
                detail in one place.
              </p>
              <Button asChild shape="pill">
                <Link href="/register">{homepage.hero.ctaSecondaryLabel}</Link>
              </Button>
            </div>
            <div
              className="min-h-56 bg-cover bg-center md:min-h-full"
              style={{ backgroundImage: `url(${homepage.hero.imageUrl})` }}
            />
          </div>
        </Reveal>
      </div>
    </>
  );
}
