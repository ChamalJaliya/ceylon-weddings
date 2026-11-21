// Run: node --experimental-strip-types --test packages/ui/src/lib/utils.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cn } from "./utils.ts";

test("cn keeps token font sizes next to text colours", () => {
  assert.equal(cn("text-label font-medium", "text-love-fg"), "text-label font-medium text-love-fg");
  assert.equal(cn("text-h4 text-hero-muted"), "text-h4 text-hero-muted");
});

test("cn still dedupes within a token group", () => {
  assert.equal(cn("text-label", "text-caption"), "text-caption");
  assert.equal(cn("text-sm", "text-label"), "text-label");
  assert.equal(cn("shadow-card", "shadow-dock"), "shadow-dock");
  assert.equal(cn("tracking-eyebrow text-primary", "tracking-spaced"), "text-primary tracking-spaced");
});
