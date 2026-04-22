import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { runPaymentsContract } from "../contract.ts";
import {
  createFetchLemonSqueezyClient,
  LemonSqueezyPayments,
  type LemonSqueezyCheckout,
  type LemonSqueezyClient,
} from "./lemonsqueezy.ts";

function makeClient(): LemonSqueezyClient {
  return {
    createCheckout: vi.fn(
      (): Promise<LemonSqueezyCheckout> =>
        Promise.resolve({
          id: "co_1",
          attributes: { url: "https://ls.test/c/1" },
        }),
    ),
  };
}

runPaymentsContract(
  "LemonSqueezyPayments",
  () =>
    new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec_test",
      storeId: "store_1",
    }),
);

function signLs(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

describe("LemonSqueezyPayments specifics", () => {
  it("forwards checkout params using storeId + priceId→variant", async () => {
    const client = makeClient();
    const payments = new LemonSqueezyPayments({
      client,
      webhookSecret: "whsec",
      storeId: "store_42",
    });
    const result = await payments.createCheckoutSession({
      priceId: "var_77",
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
      customerEmail: "u@example.com",
      metadata: { k: "v" },
    });
    expect(result).toEqual({
      url: "https://ls.test/c/1",
      sessionId: "co_1",
    });
    expect(client.createCheckout).toHaveBeenCalledWith({
      storeId: "store_42",
      variantId: "var_77",
      redirectUrl: "http://ok",
      email: "u@example.com",
      custom: { k: "v" },
    });
  });

  it("returns nulls when createCheckout throws", async () => {
    const client: LemonSqueezyClient = {
      createCheckout: vi.fn(
        (): Promise<LemonSqueezyCheckout> => Promise.reject(new Error("down")),
      ),
    };
    const result = await new LemonSqueezyPayments({
      client,
      webhookSecret: "s",
      storeId: "store_1",
    }).createCheckoutSession({
      priceId: "var_x",
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
    });
    expect(result).toEqual({ url: null, sessionId: null });
  });

  it("verifyWebhook returns a structured event on valid signature", async () => {
    const rawBody = JSON.stringify({
      meta: { event_name: "order_created", webhook_id: 123 },
      data: { attributes: { foo: "bar" } },
    });
    const payments = new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec",
      storeId: "s",
    });
    const event = await payments.verifyWebhook(
      rawBody,
      signLs("whsec", rawBody),
    );
    expect(event).toEqual({
      id: "123",
      type: "order_created",
      payload: { attributes: { foo: "bar" } },
    });
  });

  it("verifyWebhook returns null on mismatched signature", async () => {
    const rawBody = "{}";
    const payments = new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec",
      storeId: "s",
    });
    await expect(
      payments.verifyWebhook(rawBody, signLs("wrong", rawBody)),
    ).resolves.toBeNull();
  });

  it("verifyWebhook returns null on missing meta fields", async () => {
    const rawBody = JSON.stringify({ data: {} });
    const payments = new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec",
      storeId: "s",
    });
    await expect(
      payments.verifyWebhook(rawBody, signLs("whsec", rawBody)),
    ).resolves.toBeNull();
  });

  it("verifyWebhook returns null when rawBody is not JSON", async () => {
    const rawBody = "not-json";
    const payments = new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec",
      storeId: "s",
    });
    await expect(
      payments.verifyWebhook(rawBody, signLs("whsec", rawBody)),
    ).resolves.toBeNull();
  });

  it("verifyWebhook returns null when signature has wrong length", async () => {
    const payments = new LemonSqueezyPayments({
      client: makeClient(),
      webhookSecret: "whsec",
      storeId: "s",
    });
    await expect(payments.verifyWebhook("{}", "short")).resolves.toBeNull();
  });
});

describe("createFetchLemonSqueezyClient", () => {
  it("POSTs to /v1/checkouts with JSON:API payload", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              id: "co_99",
              attributes: { url: "https://ls.test/c/99" },
            },
          }),
          { status: 201 },
        ),
      ),
    );
    const client = createFetchLemonSqueezyClient({ apiKey: "ls-key", fetcher });
    const result = await client.createCheckout({
      storeId: "store_42",
      variantId: "var_77",
      redirectUrl: "http://ok",
      email: "u@example.com",
      custom: { k: "v" },
    });
    expect(result).toEqual({
      id: "co_99",
      attributes: { url: "https://ls.test/c/99" },
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.lemonsqueezy.com/v1/checkouts");
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer ls-key",
    );
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/vnd.api+json",
    );
    const parsed = JSON.parse(
      typeof init.body === "string" ? init.body : "",
    ) as {
      data: {
        type: string;
        attributes: {
          product_options: { redirect_url: string };
          checkout_data: { email?: string; custom?: Record<string, string> };
        };
        relationships: {
          store: { data: { type: string; id: string } };
          variant: { data: { type: string; id: string } };
        };
      };
    };
    expect(parsed.data.type).toBe("checkouts");
    expect(parsed.data.attributes.product_options.redirect_url).toBe(
      "http://ok",
    );
    expect(parsed.data.attributes.checkout_data.email).toBe("u@example.com");
    expect(parsed.data.relationships.store.data.id).toBe("store_42");
    expect(parsed.data.relationships.variant.data.id).toBe("var_77");
  });

  it("throws on non-2xx", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 422 })),
    );
    const client = createFetchLemonSqueezyClient({ apiKey: "k", fetcher });
    await expect(
      client.createCheckout({
        storeId: "s",
        variantId: "v",
        redirectUrl: "http://x",
      }),
    ).rejects.toThrow(/422/);
  });
});
