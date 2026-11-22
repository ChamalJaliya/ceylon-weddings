/**
 * Enables all ad slots and seeds ACTIVE paid campaigns so every placement
 * is visible on the guest site. Safe to re-run (upserts by campaign name).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type PromotionSlot } from "../src/generated/prisma/client";

config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const startsAt = new Date(Date.now() - 86400000);
const endsAt = new Date(Date.now() + 86400000 * 90);

async function upsertPromo(input: {
  name: string;
  headline: string;
  subheadline?: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  coverUrl: string;
  layout: "SPOTLIGHT" | "BANNER" | "CARD" | "STRIP" | "PICKS_TILE";
  slots: PromotionSlot[];
  categories?: string[];
  cities?: string[];
  vendorId?: string | null;
  priority?: number;
  source?: "EDITORIAL" | "PAID" | "COMPED" | "PAID_PENDING";
  badgeLabel?: string | null;
}) {
  const existing = await prisma.promotion.findFirst({ where: { name: input.name } });
  const data = {
    name: input.name,
    status: "ACTIVE" as const,
    headline: input.headline,
    subheadline: input.subheadline ?? null,
    body: input.body ?? null,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    coverUrl: input.coverUrl,
    accentColor: "#7c2d12",
    overlayTone: "light",
    layout: input.layout,
    badgeLabel: input.badgeLabel ?? "Sponsored",
    slots: input.slots,
    cities: input.cities ?? [],
    categories: input.categories ?? [],
    locales: ["en"],
    startsAt,
    endsAt,
    priority: input.priority ?? 80,
    vendorId: input.vendorId ?? null,
    source: input.source ?? "PAID",
  };
  if (existing) {
    return prisma.promotion.update({ where: { id: existing.id }, data });
  }
  return prisma.promotion.create({ data });
}

async function main() {
  const bySlug = Object.fromEntries(
    (
      await prisma.vendor.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          photoUrl: true,
          city: true,
          categoryType: { select: { slug: true } },
        },
      })
    ).map((v) => [v.slug, v]),
  );

  const lotus = bySlug["lotus-photography"];
  const glen = bySlug["glen-receptions"];
  const blooms = bySlug["temple-blooms"];
  const glam = bySlug["glam-by-nadeesha"];
  const cake = bySlug["butter-and-bloom"];
  const fleet = bySlug["bridal-fleet-colombo"];
  const drums = bySlug["magul-bera-collective"];
  const saffron = bySlug["saffron-kitchen"];
  const hills = bySlug["kandy-hills-estate"] ?? bySlug["fort-lawn-galle"] ?? glen;

  // Enable every slot for demo visibility (CATALOG_TOP stays off — INLINE replaces it).
  const enableAll = [
    "HOME_HERO",
    "HOME_PICKS",
    "CATALOG_INLINE",
    "CATALOG_DATE_AVAILABLE",
    "CATALOG_MAP",
    "IDEAS_INLINE",
    "VENDOR_COMPLEMENTARY",
    "VENDOR_SIMILAR",
    "COMPARE_SUGGEST",
    "ARTICLE_INLINE",
    "ARTICLE_NEXT_STEP",
    "ARTICLE_STORY_CREDITS",
    "REELS",
    "AWARDS_CATEGORY",
  ] as PromotionSlot[];

  for (const slot of enableAll) {
    await prisma.promotionSlotConfig.updateMany({
      where: { slot },
      data: { enabled: true },
    });
  }
  await prisma.promotionSlotConfig.updateMany({
    where: { slot: { in: ["CATALOG_TOP", "VENDOR_SIDEBAR", "IDEAS_RAIL"] } },
    data: { enabled: false },
  });

  // Fix legacy editorial promo — remove CATALOG_TOP, keep home editorial.
  if (lotus) {
    await upsertPromo({
      name: "Homepage spotlight — Lotus",
      headline: "Film your poruwa like a love letter",
      subheadline: "Editorial photography coverage across the island.",
      ctaLabel: "View Lotus Photography",
      ctaHref: "/vendors/lotus-photography",
      coverUrl: lotus.photoUrl ?? "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1400&q=80",
      layout: "SPOTLIGHT",
      slots: ["HOME_HERO", "HOME_PICKS"],
      categories: ["PHOTO_VIDEO"],
      vendorId: lotus.id,
      source: "EDITORIAL",
      badgeLabel: "Featured",
      priority: 100,
    });
  }

  if (glen) {
    await upsertPromo({
      name: "Catalog inline — Glen Receptions",
      headline: "Garden halls that hold late nekath",
      subheadline: "Sponsored venue for Colombo & Negombo searches",
      ctaLabel: "View Glen Receptions",
      ctaHref: "/vendors/glen-receptions",
      coverUrl: glen.photoUrl ?? "https://images.unsplash.com/photo-1519167758481-83f29da8c12f?w=1200&q=80",
      layout: "CARD",
      slots: ["CATALOG_INLINE", "CATALOG_MAP", "CATALOG_DATE_AVAILABLE"],
      categories: ["VENUE"],
      cities: ["Colombo", "Negombo"],
      vendorId: glen.id,
      priority: 95,
    });
  }

  if (blooms) {
    await upsertPromo({
      name: "Catalog inline — Temple Blooms",
      headline: "Poruwa florals that travel with you",
      ctaLabel: "View Temple Blooms",
      ctaHref: "/vendors/temple-blooms",
      coverUrl: blooms.photoUrl ?? "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
      layout: "CARD",
      slots: ["CATALOG_INLINE", "VENDOR_COMPLEMENTARY", "ARTICLE_STORY_CREDITS"],
      categories: ["FLORIST_DECOR"],
      vendorId: blooms.id,
      priority: 90,
    });
  }

  if (glam) {
    await upsertPromo({
      name: "Complete your team — Glam by Nadeesha",
      headline: "Soft glam that lasts through kiribath",
      ctaLabel: "Book a trial",
      ctaHref: "/vendors/glam-by-nadeesha",
      coverUrl: glam.photoUrl ?? "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
      layout: "CARD",
      slots: ["VENDOR_COMPLEMENTARY", "ARTICLE_STORY_CREDITS", "COMPARE_SUGGEST"],
      categories: ["HAIR_MAKEUP"],
      vendorId: glam.id,
      priority: 88,
    });
  }

  if (fleet) {
    await upsertPromo({
      name: "Similar / fleet — Bridal Fleet",
      headline: "Ribbon-ready cars for Colombo days",
      ctaLabel: "See the fleet",
      ctaHref: "/vendors/bridal-fleet-colombo",
      coverUrl: fleet.photoUrl ?? "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1200&q=80",
      layout: "CARD",
      slots: ["VENDOR_SIMILAR", "CATALOG_INLINE", "REELS"],
      categories: ["WEDDING_CARS"],
      vendorId: fleet.id,
      priority: 85,
    });
  }

  if (cake) {
    await upsertPromo({
      name: "Ideas + article — Butter and Bloom",
      headline: "Cake cutting after kiribath, not instead of it",
      subheadline: "Sponsored story guidance from Butter and Bloom",
      ctaLabel: "Browse cakes",
      ctaHref: "/vendors/butter-and-bloom",
      coverUrl: cake.photoUrl ?? "https://images.unsplash.com/photo-1564986021890-6f721f19c210?w=1200&q=80",
      layout: "CARD",
      slots: ["IDEAS_INLINE", "ARTICLE_INLINE", "ARTICLE_NEXT_STEP"],
      categories: ["CAKE"],
      vendorId: cake.id,
      priority: 84,
      badgeLabel: "Sponsored story",
    });
  }

  if (drums) {
    await upsertPromo({
      name: "Reels — Magul Bera Collective",
      headline: "Drum beats for the poruwa walk",
      ctaLabel: "Watch & inquire",
      ctaHref: "/vendors/magul-bera-collective",
      coverUrl: drums.photoUrl ?? "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
      layout: "STRIP",
      slots: ["REELS", "HOME_PICKS"],
      categories: ["ENTERTAINMENT"],
      vendorId: drums.id,
      priority: 82,
    });
  }

  if (saffron) {
    await upsertPromo({
      name: "Awards category — Saffron Kitchen",
      headline: "Best Caterer, presented by Saffron Kitchen",
      subheadline: "Category sponsor for the awards board",
      ctaLabel: "View Saffron",
      ctaHref: "/vendors/saffron-kitchen",
      coverUrl: saffron.photoUrl ?? "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      layout: "BANNER",
      slots: ["AWARDS_CATEGORY"],
      categories: ["CATERER"],
      vendorId: saffron.id,
      priority: 80,
    });
  }

  if (hills) {
    await upsertPromo({
      name: "Compare suggest — destination venue",
      headline: "Add a third option for your shortlist",
      subheadline: "Same city energy, different mood",
      ctaLabel: "View venue",
      ctaHref: `/vendors/${hills.slug}`,
      coverUrl: hills.photoUrl ?? "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
      layout: "CARD",
      slots: ["COMPARE_SUGGEST", "VENDOR_SIMILAR"],
      categories: ["VENUE"],
      vendorId: hills.id,
      priority: 87,
    });
  }

  // Packages for Promote studio demo
  const packages = [
    {
      slug: "catalog-spotlight",
      name: "Catalog spotlight",
      slots: ["CATALOG_INLINE"] as PromotionSlot[],
      priceLkr: 35000,
      durationDays: 7,
    },
    {
      slug: "complete-your-team",
      name: "Complete your team",
      slots: ["VENDOR_COMPLEMENTARY"] as PromotionSlot[],
      priceLkr: 28000,
      durationDays: 7,
    },
    {
      slug: "shop-this-wedding",
      name: "Shop this wedding",
      slots: ["ARTICLE_STORY_CREDITS"] as PromotionSlot[],
      priceLkr: 12000,
      durationDays: 14,
    },
    {
      slug: "compare-boost",
      name: "Compare boost",
      slots: ["COMPARE_SUGGEST"] as PromotionSlot[],
      priceLkr: 32000,
      durationDays: 7,
    },
    {
      slug: "reels-week",
      name: "Reels week",
      slots: ["REELS"] as PromotionSlot[],
      priceLkr: 24000,
      durationDays: 7,
    },
  ];

  for (const [index, pkg] of packages.entries()) {
    await prisma.promotionPackage.upsert({
      where: { slug: pkg.slug },
      create: {
        name: pkg.name,
        slug: pkg.slug,
        description: `${pkg.name} — demo package`,
        slots: pkg.slots,
        priceLkr: pkg.priceLkr,
        interval: "WEEK",
        durationDays: pkg.durationDays,
        active: true,
        sortOrder: (index + 1) * 10,
      },
      update: {
        active: true,
        priceLkr: pkg.priceLkr,
        slots: pkg.slots,
        durationDays: pkg.durationDays,
      },
    });
  }

  const slotCount = await prisma.promotionSlotConfig.count({ where: { enabled: true } });
  const promoCount = await prisma.promotion.count({ where: { status: "ACTIVE" } });
  console.log(`Enabled slots: ${slotCount}; ACTIVE promos: ${promoCount}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
