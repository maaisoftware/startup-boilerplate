import { describe, expect, it } from "vitest";

import type { FeatureFlags } from "./interfaces.ts";

/**
 * Shared contract suite. Every FeatureFlags adapter passes this.
 */
export function runFeatureFlagsContract(
  name: string,
  create: () => FeatureFlags,
): void {
  describe(`${name} — FeatureFlags contract`, () => {
    it("isEnabled never throws", async () => {
      const f = create();
      // Both sync and async adapters are valid — normalise to a promise.
      const r1 = await Promise.resolve(f.isEnabled("admin-ui"));
      const r2 = await Promise.resolve(
        f.isEnabled("admin-ui", { distinctId: "u" }),
      );
      expect(typeof r1).toBe("boolean");
      expect(typeof r2).toBe("boolean");
    });

    it("getVariant returns string or null", async () => {
      const f = create();
      const v = await Promise.resolve(f.getVariant("admin-ui"));
      expect(v === null || typeof v === "string").toBe(true);
    });

    it("close() resolves", async () => {
      const f = create();
      await expect(f.close()).resolves.toBeUndefined();
    });

    it("returns safe defaults on unknown behaviour", async () => {
      const f = create();
      // Must never throw; truthiness may differ by adapter, but the call
      // itself must produce a boolean-or-promise result.
      const result = await Promise.resolve(f.isEnabled("stripe-checkout"));
      expect(typeof result).toBe("boolean");
    });
  });
}
