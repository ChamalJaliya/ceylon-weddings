/**
 * Node test-runner resolve hook: lets `node --test` load our TS sources the
 * way the bundler does — extensionless relative imports resolve to .ts/.tsx
 * or a folder index. Used with --experimental-strip-types (see scripts/test.mjs).
 */
import { registerHooks } from "node:module";

const CANDIDATES = [".ts", ".tsx", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const relative = specifier.startsWith("./") || specifier.startsWith("../");
      if (!relative || /\.[cm]?[jt]sx?$/.test(specifier)) throw error;
      for (const suffix of CANDIDATES) {
        try {
          return nextResolve(specifier + suffix, context);
        } catch {
          // try next candidate
        }
      }
      throw error;
    }
  },
});
