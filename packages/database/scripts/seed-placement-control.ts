import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const defaults = [
  ["HOME_HERO", true, "Homepage", "Hero", "SPOTLIGHT", 1, null, "SPONSORED", 45000, "WEEK", 10],
  ["HOME_PICKS", true, "Homepage", "Picks", "PICKS_TILE", 2, null, "SPONSORED", 25000, "WEEK", 20],
  ["CATALOG_TOP", false, "Vendor catalog", "Top strip", "STRIP", 1, null, "SPONSORED", 20000, "WEEK", 30],
  ["CATALOG_INLINE", true, "Vendor catalog", "Grid", "CARD", 4, 12, "SPONSORED", 35000, "WEEK", 40],
  [
    "CATALOG_DATE_AVAILABLE",
    false,
    "Vendor catalog",
    "Date available",
    "CARD",
    4,
    null,
    "SPONSORED",
    30000,
    "WEEK",
    50,
  ],
  ["CATALOG_MAP", false, "Vendor catalog", "Map", "CARD", 6, null, "SPONSORED", 28000, "WEEK", 60],
  ["IDEAS_RAIL", false, "Ideas", "Rail", "PICKS_TILE", 2, null, "SPONSORED", 18000, "WEEK", 70],
  ["IDEAS_INLINE", false, "Ideas list", "Grid", "CARD", 2, 6, "SPONSORED_STORY", 22000, "WEEK", 80],
  ["VENDOR_SIDEBAR", false, "Vendor profile", "Sidebar", "CARD", 2, null, "SPONSORED", 15000, "WEEK", 90],
  [
    "VENDOR_COMPLEMENTARY",
    true,
    "Vendor profile",
    "Complete your team",
    "CARD",
    3,
    null,
    "SPONSORED",
    28000,
    "WEEK",
    100,
  ],
  ["VENDOR_SIMILAR", false, "Vendor profile", "Similar", "CARD", 3, null, "SPONSORED", 20000, "WEEK", 110],
  ["COMPARE_SUGGEST", false, "Compare", "Add a third", "CARD", 1, null, "SPONSORED", 32000, "WEEK", 120],
  ["ARTICLE_INLINE", false, "Idea article", "Mid-article", "CARD", 1, null, "SPONSORED", 18000, "WEEK", 130],
  ["ARTICLE_NEXT_STEP", false, "Idea article", "End CTA", "BANNER", 1, null, "SPONSORED", 16000, "WEEK", 140],
  [
    "ARTICLE_STORY_CREDITS",
    true,
    "Idea article",
    "Shop this wedding",
    "CARD",
    12,
    null,
    "SPONSORED",
    12000,
    "WEEK",
    150,
  ],
  ["REELS", false, "Home / Ideas", "Reels", "STRIP", 6, null, "SPONSORED", 24000, "WEEK", 160],
  ["AWARDS_CATEGORY", false, "Awards", "Category sponsor", "BANNER", 1, null, "SPONSORED", 50000, "MONTH", 170],
] as const;

async function main() {
  for (const row of defaults) {
    const [
      slot,
      enabled,
      pageKey,
      regionKey,
      defaultLayout,
      maxPerRequest,
      densityEveryN,
      disclosure,
      priceLkr,
      interval,
      sortOrder,
    ] = row;
    await prisma.promotionSlotConfig.upsert({
      where: { slot: slot as never },
      create: {
        slot: slot as never,
        enabled,
        pageKey,
        regionKey,
        description: regionKey,
        defaultLayout: defaultLayout as never,
        maxPerRequest,
        densityEveryN,
        disclosure: disclosure as never,
        priceLkr,
        interval: interval as never,
        sortOrder,
      },
      update: {},
    });
  }

  if ((await prisma.promotionPackage.count()) === 0) {
    await prisma.promotionPackage.createMany({
      data: [
        {
          name: "Catalog spotlight",
          slug: "catalog-spotlight",
          description: "Native sponsored card in vendor search",
          slots: ["CATALOG_INLINE"],
          priceLkr: 35000,
          interval: "WEEK",
          durationDays: 7,
          active: true,
          sortOrder: 10,
        },
        {
          name: "Complete your team",
          slug: "complete-your-team",
          description: "Complementary profile placements",
          slots: ["VENDOR_COMPLEMENTARY"],
          priceLkr: 28000,
          interval: "WEEK",
          durationDays: 7,
          active: true,
          sortOrder: 20,
        },
        {
          name: "Shop this wedding",
          slug: "shop-this-wedding",
          description: "Boost story credits with WhatsApp",
          slots: ["ARTICLE_STORY_CREDITS"],
          priceLkr: 12000,
          interval: "WEEK",
          durationDays: 14,
          active: true,
          sortOrder: 30,
        },
      ],
    });
  }

  await prisma.promotion.updateMany({
    where: { badgeLabel: "Ceylon Pick" },
    data: { badgeLabel: "Featured" },
  });

  console.log("slots", await prisma.promotionSlotConfig.count(), "packages", await prisma.promotionPackage.count());
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
