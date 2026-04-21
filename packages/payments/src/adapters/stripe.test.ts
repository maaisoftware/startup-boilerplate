import { describe, expect, it, vi } from "vitest";

import { runPaymentsContract } from "../contract.ts";
import { StripePayments, type StripeClient } from "./stripe.ts";

function makeClient(): StripeClient {
  return {
    checkout: {
      sessions: {
        create: vi.fn(
          (): Promise<{ id: string; url: string | null }> =>
            Promise.resolve({
              id: "sess_1",
              url: "https://stripe.test/checkout",
            }),
        ),
      },
    },
    webhooks: {
      constructEventAsync: vi.fn(
        (): Promise<{ id: string; type: string; data: { object: unknown } }> =>
          Promise.resolve({
            id: "evt_1",
            type: "checkout.session.completed",
            data: { object: { id: "sess_1" } },
          }),
      ),
    },
  };
}

runPaymentsContract(
  "StripePayments",
  () =>
    new StripePayments({ client: makeClient(), webhookSecret: "whsec_test" }),
);

describe("StripePayments specifics", () => {
  it("forwards checkout params", async () => {
    const client = makeClient();
    const payments = new StripePayments({
      client,
      webhookSecret: "whsec_test",
    });
    const result = await payments.createCheckoutSession({
      priceId: "price_1",
      quantity: 2,
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
      customerEmail: "u@example.com",
      metadata: { k: "v" },
    });
    expect(result).toEqual({
      url: "https://stripe.test/checkout",
      sessionId: "sess_1",
    });
    expect(client.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: [{ price: "price_1", quantity: 2 }],
        customer_email: "u@example.com",
        metadata: { k: "v" },
      }),
    );
  });

  it("returns nulls when Stripe throws", async () => {
    const client: StripeClient = {
      checkout: {
        sessions: {
          create: vi.fn(
            (): Promise<{ id: string; url: string | null }> =>
              Promise.reject(new Error("down")),
          ),
        },
      },
      webhooks: {
        constructEventAsync: vi.fn(
          (): Promise<{
            id: string;
            type: string;
            data: { object: unknown };
          }> => Promise.reject(new Error("down")),
        ),
      },
    };
    const result = await new StripePayments({
      client,
      webhookSecret: "whsec",
    }).createCheckoutSession({
      priceId: "p",
      successUrl: "http://x/s",
      cancelUrl: "http://x/c",
    });
    expect(result).toEqual({ url: null, sessionId: null });
  });

  it("verifyWebhook returns a structured event on success", async () => {
    const client = makeClient();
    const payments = new StripePayments({
      client,
      webhookSecret: "whsec_test",
    });
    const event = await payments.verifyWebhook("{}", "t=1,v1=abc");
    expect(event).toMatchObject({
      id: "evt_1",
      type: "checkout.session.completed",
      payload: { id: "sess_1" },
    });
  });

  it("verifyWebhook returns null when Stripe rejects", async () => {
    const client: StripeClient = {
      checkout: {
        sessions: {
          create: vi.fn(
            (): Promise<{ id: string; url: string | null }> =>
              Promise.resolve({ id: "x", url: null }),
          ),
        },
      },
      webhooks: {
        constructEventAsync: vi.fn(
          (): Promise<{
            id: string;
            type: string;
            data: { object: unknown };
          }> => Promise.reject(new Error("bad sig")),
        ),
      },
    };
    const event = await new StripePayments({
      client,
      webhookSecret: "whsec",
    }).verifyWebhook("{}", "t=1,v1=bad");
    expect(event).toBeNull();
  });
});
