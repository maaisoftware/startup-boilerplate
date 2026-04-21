#!/usr/bin/env node
/**
 * Propagates the repo-root `.env.local` into each app directory so that
 * framework-specific env loaders (Next.js in particular) find it where
 * they expect. Runs automatically after `pnpm install` via the root
 * `postinstall` script, and can be invoked manually: `pnpm sync:env`.
 *
 * Design notes:
 *   - Copy, not symlink. Windows Developer Mode is not always on and
 *     `mklink /j` only works for directories.
 *   - Idempotent. Re-running after env changes is safe.
 *   - Silent no-op when the root `.env.local` does not exist (clean fork).
 *   - Marks the destination files read-only-ish by overwriting every
 *     run — treat app-dir copies as derived artefacts, never edit them.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const source = resolve(repoRoot, ".env.local");

const targets = [resolve(repoRoot, "apps/web/.env.local")];

if (!existsSync(source)) {
  // Fresh clone with no .env.local yet — skip silently.
  process.exit(0);
}

const header =
  "# AUTO-GENERATED — do not edit.\n" +
  "# Source of truth: ../../.env.local (repo root).\n" +
  "# Synced by scripts/sync-env.mjs on pnpm install and `pnpm sync:env`.\n\n";

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  // Copy first, then prepend the header so we don't pollute the original.
  copyFileSync(source, target);
  const fs = await import("node:fs");
  const body = fs.readFileSync(target, "utf8");
  writeFileSync(target, header + body);
}
