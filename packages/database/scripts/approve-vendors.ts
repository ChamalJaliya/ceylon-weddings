import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const before = await prisma.vendor.groupBy({ by: ["moderationStatus"], _count: true });
  const updated = await prisma.vendor.updateMany({
    where: { verified: true, listed: true, moderationStatus: { not: "APPROVED" } },
    data: { moderationStatus: "APPROVED" },
  });
  console.log({ before, approvedNow: updated.count });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
