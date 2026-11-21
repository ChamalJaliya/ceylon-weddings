#!/usr/bin/env node
/**
 * Move fat route files into src/features/<domain>/ and leave thin routes
 * (Kloqra layout: app/ = routing only, features/<domain>/ = pages, hooks, components).
 *
 *   node scripts/move-route-to-feature.mjs <domain> [--dry]
 *
 * For apps/web/src/app/[locale]/<domain>:
 *   <sub>/page.tsx (> THIN_LINES)   → features/<domain>/<sub>/<sub>-page.tsx
 *   page.tsx       (> THIN_LINES)   → features/<domain>/overview/overview-page.tsx
 *   _components/*                   → features/<domain>/components/*
 *   <sub>/_components/*             → features/<domain>/<sub>/components/*
 * The route file becomes `export { default } from "@/features/…";`.
 * Relative imports in moved files are rewritten to `@/…` so they survive the move.
 * Uses `git mv` so history follows the file.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const THIN_LINES = 15;
const [domain, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
if (!domain) {
  console.error("usage: move-route-to-feature.mjs <domain> [--dry]");
  process.exit(1);
}

const repo = resolve(new URL("..", import.meta.url).pathname);
const src = join(repo, "apps/web/src");
const routeRoot = join(src, "app/[locale]", domain);
const featureRoot = join(src, "features", domain);
const EXT = [".tsx", ".ts", "/index.tsx", "/index.ts"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** Next.js special files stay in app/. */
const ROUTE_FILES = new Set(["page.tsx", "layout.tsx", "loading.tsx", "error.tsx", "not-found.tsx", "template.tsx", "default.tsx", "route.ts"]);
/** Dashboards keep their root page as overview/; other domains use <domain>-page.tsx. */
const DASHBOARDS = new Set(["planning", "admin", "pro"]);
const isDynamic = (seg) => seg.startsWith("[");
const isGroup = (seg) => seg.startsWith("(");

/** Build old → new path map. */
const moves = new Map();
for (const file of walk(routeRoot)) {
  const rel = relative(routeRoot, file);
  const parts = rel.split("/");
  const name = parts.at(-1);
  // Folder inside features/: drop route groups, dynamic segments and _components.
  const dirSegs = parts.slice(0, -1).filter((s) => !isGroup(s) && !isDynamic(s) && s !== "_components");
  const dir = join(featureRoot, ...dirSegs);

  if (parts.includes("_components")) {
    moves.set(file, join(dir, "components", name));
    continue;
  }
  if (!ROUTE_FILES.has(name)) {
    // Co-located page content (vendors-catalog.tsx, faq-client.tsx …).
    moves.set(file, join(dir, name));
    continue;
  }
  if (name !== "page.tsx") continue;
  if (readFileSync(file, "utf8").split("\n").length <= THIN_LINES) continue;

  const routeSegs = parts.slice(0, -1).filter((s) => !isGroup(s));
  if (routeSegs.length === 0) {
    moves.set(file, DASHBOARDS.has(domain) ? join(featureRoot, "overview", "overview-page.tsx") : join(featureRoot, `${domain}-page.tsx`));
  } else if (isDynamic(routeSegs.at(-1))) {
    const owner = dirSegs.at(-1) ?? domain;
    moves.set(file, join(dir, `${owner}-detail-page.tsx`));
  } else {
    moves.set(file, join(dir, `${dirSegs.at(-1)}-page.tsx`));
  }
}

// Snapshot before any git mv: later files may import ones already moved.
const existed = new Set(walk(src));
const isFile = (p) => existed.has(p) || (existsSync(p) && statSync(p).isFile());

function resolveImport(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  if (isFile(base)) return base;
  for (const ext of EXT) if (isFile(base + ext)) return base + ext;
  return null;
}

function aliasFor(target) {
  const finalPath = moves.get(target) ?? target;
  return "@/" + relative(src, finalPath).replace(/\.(tsx|ts)$/, "").replace(/\/index$/, "");
}

const SEGMENT_CONFIG =
  /^export const (dynamic|revalidate|runtime|fetchCache|dynamicParams|preferredRegion|maxDuration) = ([^;\n]+);?\n\n?/gm;
const ROUTE_EXPORTS = /^export (?:async function|function|const) (generateMetadata|generateStaticParams|generateViewport|metadata|viewport)\b/gm;

const IMPORT_RE = /(from\s+|import\s*\(\s*|import\s+)(["'])(\.{1,2}\/[^"']+)\2/g;

function rewrite(file, text) {
  return text.replace(IMPORT_RE, (whole, lead, q, spec) => {
    const target = resolveImport(file, spec);
    if (!target) return whole;
    return `${lead}${q}${aliasFor(target)}${q}`;
  });
}

const git = (...args) => (dry ? console.log("git", ...args) : execFileSync("git", args, { cwd: repo, stdio: "pipe" }));

const report = [];
for (const [from, to] of moves) {
  const text = rewrite(from, readFileSync(from, "utf8"));
  if (!dry) mkdirSync(dirname(to), { recursive: true });
  git("mv", from, to);
  if (!dry) writeFileSync(to, text);
  if (from.endsWith("/page.tsx")) {
    // Route segment config must be a literal in the route file (Next reads it
    // statically), so lift it out; metadata functions can be re-exported.
    const config = [...text.matchAll(SEGMENT_CONFIG)].map((m) => `export const ${m[1]} = ${m[2]};`);
    const named = [...text.matchAll(ROUTE_EXPORTS)].map((m) => m[1]);
    const shim =
      (config.length ? `${config.join("\n")}\n\n` : "") +
      `export { ${["default", ...named].join(", ")} } from "${aliasFor(from)}";\n`;
    if (!dry) {
      writeFileSync(to, text.replace(SEGMENT_CONFIG, ""));
      writeFileSync(from, shim);
    }
    report.push(`${relative(src, from)} → ${relative(src, to)}`);
  } else {
    report.push(`${relative(src, from)} → ${relative(src, to)}`);
  }
}

// Remaining route files (thin pages, layouts) may import moved _components.
for (const file of walk(routeRoot)) {
  if (dry || moves.has(file)) continue;
  const text = readFileSync(file, "utf8");
  const next = text.replace(IMPORT_RE, (whole, lead, q, spec) => {
    const target = resolveImport(file, spec);
    return target && moves.has(target) ? `${lead}${q}${aliasFor(target)}${q}` : whole;
  });
  if (next !== text) writeFileSync(file, next);
}

console.log(report.join("\n"));
console.log(`\n${moves.size} file(s) ${dry ? "would move" : "moved"} for ${domain}`);
