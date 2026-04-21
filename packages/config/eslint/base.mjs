// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/**
 * Flat-config ESLint preset shared by every package.
 * Extend this from a package-specific config (next / react-library / node-library).
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.generated.*",
      "**/generated/**",
    ],
  },
  js.configs.recommended,
  // Type-checked rules apply to .ts/.tsx only. Config files (.mjs/.js) use the
  // lighter non-type-aware preset to avoid "file not in project" errors.
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // Never use console.* — always route through the @startup-boilerplate/logger package.
      "no-console": "error",
      // Unused vars allowed only with _ prefix.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Promises must be awaited or explicitly voided.
      "@typescript-eslint/no-floating-promises": "error",
      // Prefer import type for type-only imports.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  // React components and Next.js route handlers often rely on TS inference for
  // their return types. Requiring explicit returns creates noise without value.
  {
    files: ["**/*.tsx", "**/app/**/*.ts", "**/pages/**/*.ts", "**/api/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  // Plain JS/MJS files (configs, scripts) skip type-aware rules entirely.
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
  prettier,
];
