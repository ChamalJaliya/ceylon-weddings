"use strict";

const { spawnSync } = require("node:child_process");
const { join } = require("node:path");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://build:build@127.0.0.1:5432/build";
}

const prisma = join(__dirname, "..", "node_modules", ".bin", "prisma");
const result = spawnSync(prisma, ["generate"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
