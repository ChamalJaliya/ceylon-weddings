#!/usr/bin/env node
/**
 * Design-system guard (ported from Kloqra's STYLEGUIDE specs).
 *
 * Fails when pages or components bypass tokens:
 *   - raw Tailwind palette / white / black colour classes
 *   - arbitrary colour, size, or tracking values (text-[11px], bg-[#fff], shadow-[...rgba])
 *   - font weights above 500
 *   - hex literals in TS/TSX (except lines marked `design-system:` — user data, brand marks)
 *   - hex / raw colour functions or bold weights in any stylesheet except tokens.css
 *   - hex inside .temple / .night (themes reassign semantics only)
 *   - density media queries that drift from lib/responsive-tiers.ts
 *   - native window.alert / confirm / prompt (use useConfirm + toast)
 *
 * Run: node scripts/check-design-system.mjs   (also: node --test scripts/check-design-system.mjs)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOTS = ["apps/web/src", "packages/ui/src", "packages/web/src"];
const STYLE_ROOT = "packages/ui/src/styles";
const TOKENS = "packages/ui/src/styles/tokens.css";

const HUES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTIL = "bg|text|border|from|via|to|ring|fill|stroke|shadow|divide|outline|decoration|accent|caret|placeholder";

/** Each rule: name, regex (global), human hint. */
const SOURCE_RULES = [
  {
    name: "palette-class",
    re: new RegExp(`(?<![\\w-])(?:${COLOR_UTIL})-(?:${HUES})-\\d{2,3}\\b`, "g"),
    hint: "use a semantic token (bg-success-subtle, text-warning-fg, border-info/30 …)",
  },
  {
    name: "white-black-class",
    re: new RegExp(`(?<![\\w-])(?:${COLOR_UTIL})-(?:white|black)\\b`, "g"),
    hint: "use text-paper / bg-ink (fixed over photography) or a semantic token",
  },
  {
    name: "heavy-weight",
    re: /(?<![\w-])font-(?:semibold|bold|extrabold|black)\b/g,
    hint: "two weights only — use font-medium",
  },
  {
    name: "arbitrary-text-size",
    re: /(?<![\w-])text-\[\d[\d.]*(?:px|rem|em)\]/g,
    hint: "use text-label / text-caption / text-compact / text-body / text-h4 …",
  },
  {
    name: "arbitrary-tracking",
    re: /(?<![\w-])tracking-\[[^\]]+\]/g,
    hint: "use tracking-label / tracking-spaced / tracking-eyebrow / tracking-ornate",
  },
  {
    name: "arbitrary-color",
    re: /-\[[^\]]*(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\()[^\]]*\]/g,
    hint: "colours come from tokens — use a utility or var(--color-*)",
  },
  {
    name: "density-breakpoint",
    re: /(?<![\w-])(?:max|min)-\[\d+px\]:/g,
    hint: "use compact: / dense: variants or tokens (see lib/responsive-tiers.ts)",
  },
  {
    name: "native-dialog",
    re: /\bwindow\.(?:alert|confirm|prompt)\(|(?<![.\w])(?:alert|prompt)\(|(?<![.\w])confirm\(\s*["'`]/g,
    hint: "use useConfirm() from @ceylonweddings/ui/components/confirm-dialog, or toast from …/toaster",
  },
  {
    name: "hex-literal",
    re: /["'`]#[0-9a-fA-F]{3,8}["'`]/g,
    hint: "chrome colours live in tokens.css; mark user-data palettes with `design-system: user-data-colors`",
    allow: (line, prev) =>
      /design-system:/.test(prev) || /design-system:/.test(line) || /placeholder=["']#/.test(line),
  },
];

const CSS_RULES = [
  { name: "css-hex", re: /#[0-9a-fA-F]{3,8}\b/g, hint: "hex belongs in tokens.css primitives" },
  { name: "css-raw-color", re: /\b(?:rgba?|hsla?|oklch|oklab)\(/g, hint: "use var(--color-*) / color-mix with tokens" },
  { name: "css-heavy-weight", re: /font-weight:\s*(?:600|700|800|900|bold|bolder)\b/g, hint: "use var(--font-weight-medium)" },
  { name: "css-important", re: /!important/g, hint: "raise specificity or use a layer instead" },
];

function walk(dir, test, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist" || name === ".turbo") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, test, files);
    else if (test(name)) files.push(path);
  }
  return files;
}

const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const normalize = (css) => css.replace(/\s+/g, " ").trim();

export function scanSource(text, rules = SOURCE_RULES) {
  const hits = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    // Comments describe rules; they never ship a class.
    if (/^\s*(?:\*|\/\/|\/\*)/.test(line)) return;
    // A `design-system:` marker covers its contiguous block (up to a blank line).
    let start = i;
    while (start > 0 && lines[start - 1].trim() !== "") start -= 1;
    const prev = lines.slice(start, i).join("\n");
    for (const rule of rules) {
      for (const match of line.matchAll(rule.re)) {
        if (rule.allow?.(line, prev)) continue;
        hits.push({ line: i + 1, rule: rule.name, match: match[0], hint: rule.hint });
      }
    }
  });
  return hits;
}

export function scanCss(text) {
  return scanSource(stripCssComments(text), CSS_RULES);
}

function densityQueries() {
  const ts = readFileSync(join(root, "packages/ui/src/lib/responsive-tiers.ts"), "utf8");
  const block = ts.match(/DENSITY_MEDIA_QUERIES = \{([\s\S]*?)\} as const/)?.[1] ?? "";
  return Object.fromEntries(
    [...block.matchAll(/(\w+):\s*"([^"]+)"/g)].map(([, tier, query]) => [tier, query]),
  );
}

export function run() {
  const problems = [];

  for (const base of SOURCE_ROOTS) {
    const abs = join(root, base);
    for (const file of walk(abs, (n) => /\.(ts|tsx)$/.test(n) && !/\.(spec|test)\.tsx?$/.test(n))) {
      for (const hit of scanSource(readFileSync(file, "utf8"))) problems.push({ file, ...hit });
    }
  }

  for (const file of walk(join(root, STYLE_ROOT), (n) => n.endsWith(".css"))) {
    if (relative(root, file) === TOKENS) continue;
    for (const hit of scanCss(readFileSync(file, "utf8"))) problems.push({ file, ...hit });
  }
  const appCss = join(root, "apps/web/src/app/globals.css");
  for (const hit of scanCss(readFileSync(appCss, "utf8"))) problems.push({ file: appCss, ...hit });

  // Themes reassign semantic tokens only — no new hex inside .temple / .night.
  const tokens = stripCssComments(readFileSync(join(root, TOKENS), "utf8"));
  for (const theme of ["temple", "night"]) {
    const body = tokens.match(new RegExp(`\\.${theme}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
    if (!body) problems.push({ file: join(root, TOKENS), line: 0, rule: "theme-missing", match: `.${theme}`, hint: "theme block not found" });
    for (const m of body.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      problems.push({ file: join(root, TOKENS), line: 0, rule: "theme-hex", match: `.${theme} ${m[0]}`, hint: "point at a primitive with var()" });
    }
  }

  // Density tiers: TS is the single owner; CSS must copy the query verbatim.
  const queries = densityQueries();
  const density = normalize(stripCssComments(readFileSync(join(root, STYLE_ROOT, "density.css"), "utf8")));
  const globals = normalize(stripCssComments(readFileSync(join(root, STYLE_ROOT, "globals.css"), "utf8")));
  for (const [tier, query] of Object.entries(queries)) {
    const q = normalize(query);
    if (!density.includes(`@media ${q}`)) {
      problems.push({ file: join(root, STYLE_ROOT, "density.css"), line: 0, rule: "density-drift", match: tier, hint: `expected @media ${q}` });
    }
    if (tier !== "phone" && !globals.includes(`@custom-variant ${tier} { @media ${q}`)) {
      problems.push({ file: join(root, STYLE_ROOT, "globals.css"), line: 0, rule: "density-drift", match: tier, hint: `expected @custom-variant ${tier} with ${q}` });
    }
  }
  // Only density.css may own viewport height / resolution queries.
  for (const file of walk(join(root, STYLE_ROOT), (n) => n.endsWith(".css"))) {
    if (/density\.css$|globals\.css$/.test(file)) continue;
    const css = stripCssComments(readFileSync(file, "utf8"));
    for (const m of css.matchAll(/@media[^{]*(?:height|resolution)[^{]*/g)) {
      problems.push({ file, line: 0, rule: "density-owner", match: m[0].trim(), hint: "viewport density lives in density.css" });
    }
  }

  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
const underNodeTest = process.argv.includes("--test") || process.env.NODE_TEST_CONTEXT;

if (underNodeTest) {
  const { test } = await import("node:test");
  const assert = await import("node:assert/strict");
  test("design system: no token bypasses", () => {
    const problems = run();
    assert.equal(problems.length, 0, problems.map((p) => `${relative(root, p.file)}:${p.line} ${p.rule} ${p.match}`).join("\n"));
  });
  test("guard catches what it should", () => {
    const sample = `<div className="bg-amber-500/15 text-white font-bold text-[11px] tracking-[0.2em] bg-[#fff] max-[1400px]:hidden" />\nconst c = "#abc";\nif (!window.confirm("x")) alert("y");`;
    const rules = new Set(scanSource(sample).map((h) => h.rule));
    for (const r of ["palette-class", "white-black-class", "heavy-weight", "arbitrary-text-size", "arbitrary-tracking", "arbitrary-color", "density-breakpoint", "hex-literal", "native-dialog"]) {
      assert.ok(rules.has(r), `missing ${r}`);
    }
    assert.equal(scanSource(`// design-system: user-data-colors\nconst c = "#abc";`).length, 0);
    assert.equal(scanSource(`<div className="bg-primary text-muted-foreground font-medium text-label" />`).length, 0);
  });
} else if (isMain) {
  const problems = run();
  if (problems.length) {
    for (const p of problems) {
      console.error(`${relative(root, p.file)}:${p.line}  [${p.rule}] ${p.match}\n    → ${p.hint}`);
    }
    console.error(`\n✗ design-system: ${problems.length} problem(s). See packages/ui/STYLEGUIDE.md`);
    process.exit(1);
  }
  console.log("✓ design-system: tokens respected");
}
