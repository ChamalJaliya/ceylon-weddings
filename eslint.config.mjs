/**
 * ESLint flat config (ported from Kloqra's @kloqra/config-eslint: base + react + nest layers).
 * Design-token rules live in scripts/check-design-system.mjs; this file covers code correctness.
 */
import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const API_MODULES =
  "(admin|ai|auth|consultations|health|jobs|messaging|realtime|search|subscription|vendor-taxonomy|weddings)";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/generated/**",
      "**/next-env.d.ts",
      "apps/mobile/**",
      "apps/ai/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // prefer-inline: the default fixer merges value imports into `import type {…}` (breaks builds).
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // React: web app + UI kit + shared client
  {
    files: ["apps/web/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}", "packages/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks, "@next/next": nextPlugin, "jsx-a11y": jsxA11y },
    settings: { react: { version: "detect" }, next: { rootDir: "apps/web/" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Feature pages import shared code via @/ — never climb out of the feature tree.
  {
    files: ["apps/web/src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ regex: String.raw`^(\.\./){2,}`, message: "Use the @/ alias instead of ../../ paths." }] },
      ],
    },
  },
  // Nest API
  {
    files: ["apps/api/src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: String.raw`^\.\./(\.\./)+${API_MODULES}/`,
              message:
                "Import other modules through their Nest module exports or src/common/, not relative cross-module paths.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/database/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Nest DI needs runtime class references (emitDecoratorMetadata).
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // CLIs and seeds talk to the terminal.
    files: ["scripts/**/*.mjs", "**/prisma/**/*.ts", "**/scripts/**/*.ts", "apps/api/src/main.ts"],
    rules: { "no-console": "off" },
  },
];
