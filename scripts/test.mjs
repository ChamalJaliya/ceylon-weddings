#!/usr/bin/env node
/**
 * Runs every *.test.ts under packages/ and apps/ with Node's built-in runner
 * (no Vitest/Jest install). TS is stripped natively; scripts/ts-test-hooks.mjs
 * resolves extensionless imports. Usage: pnpm test [-- <path filter>]
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const filter = process.argv[2] ?? "";
const skip = new Set(["node_modules", ".next", "dist", ".turbo"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const files = ["packages", "apps"]
  .flatMap((d) => walk(join(root, d)))
  .filter((f) => relative(root, f).includes(filter));

const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--no-warnings=ExperimentalWarning",
    "--import",
    join(root, "scripts/ts-test-hooks.mjs"),
    "--test",
    join(root, "scripts/check-design-system.mjs"),
    ...files,
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
