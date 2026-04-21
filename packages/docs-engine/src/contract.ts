import { describe, expect, it } from "vitest";
import type { DocsEngine } from "./interfaces.ts";

export function runDocsEngineContract(
  name: string,
  create: () => DocsEngine,
): void {
  describe(`${name} — DocsEngine contract`, () => {
    it("list returns an array", async () => {
      const result = await create().list();
      expect(Array.isArray(result)).toBe(true);
    });
    it("get returns null for unknown slug", async () => {
      expect(await create().get("definitely-not-a-real-slug-xyz")).toBeNull();
    });
  });
}
