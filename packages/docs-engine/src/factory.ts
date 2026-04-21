import { resolve } from "node:path";

import { VaultDocsEngine } from "./adapters/vault.ts";
import type { DocsEngine } from "./interfaces.ts";

let cached: DocsEngine | undefined;

/** Returns the shared docs engine. Currently only `vault` is supported. */
export function getDocsEngine(options: { root?: string } = {}): DocsEngine {
  if (cached) return cached;
  const root = options.root ?? resolve(process.cwd(), "knowledge");
  cached = new VaultDocsEngine({ root });
  return cached;
}

export function __resetDocsEngineCacheForTests(): void {
  cached = undefined;
}
