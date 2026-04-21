import { describe, expect, it } from "vitest";

import type { Analytics } from "./interfaces.ts";

/**
 * Shared contract suite for Analytics adapters. Every adapter MUST pass
 * these cases to guarantee interface fidelity and safety.
 */
export function runAnalyticsContract(
  name: string,
  create: () => Analytics,
): void {
  describe(`${name} — Analytics contract`, () => {
    it("capture() never throws, even with unusual properties", () => {
      const a = create();
      expect(() =>
        a.capture({
          event: "e",
          distinctId: "u",
          properties: { n: 1, s: "x", b: true, o: { nested: 1 } },
        }),
      ).not.toThrow();
    });

    it("identify() never throws", () => {
      const a = create();
      expect(() => a.identify("u")).not.toThrow();
      expect(() => a.identify("u", { plan: "pro" })).not.toThrow();
    });

    it("reset() is a safe no-op", () => {
      const a = create();
      expect(() => a.reset()).not.toThrow();
    });

    it("flush() resolves", async () => {
      const a = create();
      await expect(a.flush()).resolves.toBeUndefined();
    });

    it("close() resolves", async () => {
      const a = create();
      await expect(a.close()).resolves.toBeUndefined();
    });
  });
}
