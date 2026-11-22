import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const vendors = await prisma.vendor.findMany({
    take: 15,
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      listed: true,
      verified: true,
      whatsapp: true,
      photoUrl: true,
      categoryType: { select: { slug: true } },
    },
  });
  const promos = await prisma.promotion.findMany({
    select: { id: true, name: true, slots: true, status: true, source: true, vendorId: true },
  });
  const slots = await prisma.promotionSlotConfig.findMany({
    select: { slot: true, enabled: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log(JSON.stringify({ vendors, promos, slots }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
