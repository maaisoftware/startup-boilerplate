import { describe, expect, it } from "vitest";

import type { Payments } from "./interfaces.ts";

export function runPaymentsContract(
  name: string,
  create: () => Payments,
): void {
  describe(`${name} — Payments contract`, () => {
    it("isEnabled is a boolean", () => {
      const p = create();
      expect(typeof p.isEnabled()).toBe("boolean");
    });

    it("createCheckoutSession resolves without throwing", async () => {
      const p = create();
      const result = await p.createCheckoutSession({
        priceId: "price_test",
        successUrl: "http://localhost/ok",
        cancelUrl: "http://localhost/cancel",
      });
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("sessionId");
    });

    it("verifyWebhook returns null on missing signature", async () => {
      const p = create();
      expect(await p.verifyWebhook("{}", null)).toBeNull();
    });
  });
}
