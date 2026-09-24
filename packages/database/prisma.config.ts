import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

config({ path: resolve(__dirname, "../../.env") });

// prisma generate does not need a live database. Keep a dummy URL so CI /
// turbo can run without DATABASE_URL (or with an empty value).
process.env.DATABASE_URL ||= "postgresql://build:build@127.0.0.1:5432/build";
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
