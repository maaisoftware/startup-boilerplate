import { describe, expect, it } from "vitest";
import { runPaymentsContract } from "../contract.ts";
import { NoopPayments } from "./noop.ts";

runPaymentsContract("NoopPayments", () => new NoopPayments());

describe("NoopPayments specifics", () => {
  it("isEnabled returns false", () => {
    expect(new NoopPayments().isEnabled()).toBe(false);
  });
  it("checkout returns nulls", async () => {
    const r = await new NoopPayments().createCheckoutSession({
      priceId: "p",
      successUrl: "http://x/s",
      cancelUrl: "http://x/c",
    });
    expect(r).toEqual({ url: null, sessionId: null });
  });
});
