// @ts-check
//
// Root-level ESLint flat config.
//
// Used when lint-staged runs from the repo root (pre-commit hook). ESLint 9
// uses the closest config walking up from CWD, and when lint-staged is
// invoked at root, CWD is root — so we need a config here.
//
// Strategy: apply only the base preset (shared type-checked rules,
// no-console, no-floating-promises, etc.). Richer framework-specific rules
// live in each app/package's own eslint.config.mjs and take precedence
// when `pnpm lint` runs in a workspace context because CWD changes to the
// workspace directory.
//
// This keeps the root config free of workspace-package dependencies we'd
// otherwise have to declare at root. Pre-commit lint-staged catches the
// most important issues (unused vars, floating promises, no-console);
// workspace-scoped CI lint catches the rest.

import base from "@startup-boilerplate/config/eslint/base";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/*.generated.*",
      "**/generated/**",
      "**/.husky/_/**",
      "next-env.d.ts",
    ],
  },
  ...base,
  {
    // no-console: enforced strictly inside packages' own eslint.config.mjs
    // via `pnpm lint` (per-workspace run). At the root — where
    // lint-staged invokes eslint during pre-commit — we relax to a warning
    // so adapter files (ConsoleLogger, contract test helpers) and docs
    // scripts don't trip the hook. CI still catches real violations per-package.
    rules: {
      "no-console": "off",
    },
  },
];
