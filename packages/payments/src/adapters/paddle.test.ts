import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { runPaymentsContract } from "../contract.ts";
import {
  createFetchPaddleClient,
  PaddlePayments,
  type PaddleClient,
  type PaddleTransaction,
} from "./paddle.ts";

function makeClient(): PaddleClient {
  return {
    createTransaction: vi.fn(
      (): Promise<PaddleTransaction> =>
        Promise.resolve({
          id: "txn_1",
          checkout: { url: "https://paddle.test/checkout" },
        }),
    ),
  };
}

runPaymentsContract(
  "PaddlePayments",
  () =>
    new PaddlePayments({ client: makeClient(), webhookSecret: "whsec_test" }),
);

function signPaddle(
  secret: string,
  timestamp: number,
  rawBody: string,
): string {
  const hash = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");
  return `ts=${timestamp};h1=${hash}`;
}

describe("PaddlePayments specifics", () => {
  it("forwards checkout params and returns hosted URL", async () => {
    const client = makeClient();
    const payments = new PaddlePayments({
      client,
      webhookSecret: "whsec",
    });
    const result = await payments.createCheckoutSession({
      priceId: "pri_1",
      quantity: 3,
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
      customerEmail: "u@example.com",
      metadata: { k: "v" },
    });
    expect(result).toEqual({
      url: "https://paddle.test/checkout",
      sessionId: "txn_1",
    });
    expect(client.createTransaction).toHaveBeenCalledWith({
      items: [{ priceId: "pri_1", quantity: 3 }],
      successUrl: "http://ok",
      customerEmail: "u@example.com",
      metadata: { k: "v" },
    });
  });

  it("returns nulls when the transaction has no checkout URL", async () => {
    const client: PaddleClient = {
      createTransaction: vi.fn(
        (): Promise<PaddleTransaction> =>
          Promise.resolve({ id: "txn_x", checkout: null }),
      ),
    };
    const result = await new PaddlePayments({
      client,
      webhookSecret: "whsec",
    }).createCheckoutSession({
      priceId: "pri_x",
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
    });
    expect(result).toEqual({ url: null, sessionId: "txn_x" });
  });

  it("returns nulls when the client throws", async () => {
    const client: PaddleClient = {
      createTransaction: vi.fn(
        (): Promise<PaddleTransaction> => Promise.reject(new Error("down")),
      ),
    };
    const result = await new PaddlePayments({
      client,
      webhookSecret: "whsec",
    }).createCheckoutSession({
      priceId: "pri_x",
      successUrl: "http://ok",
      cancelUrl: "http://cancel",
    });
    expect(result).toEqual({ url: null, sessionId: null });
  });

  it("verifyWebhook returns a structured event on valid signature", async () => {
    const ts = 1_700_000_000;
    const rawBody = JSON.stringify({
      event_id: "evt_1",
      event_type: "transaction.completed",
      data: { foo: "bar" },
    });
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
      now: () => ts * 1000,
    });
    const event = await payments.verifyWebhook(
      rawBody,
      signPaddle("whsec", ts, rawBody),
    );
    expect(event).toEqual({
      id: "evt_1",
      type: "transaction.completed",
      payload: { foo: "bar" },
    });
  });

  it("verifyWebhook rejects mismatched signatures", async () => {
    const ts = 1_700_000_000;
    const rawBody = "{}";
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
      now: () => ts * 1000,
    });
    const bad = signPaddle("wrong-secret", ts, rawBody);
    await expect(payments.verifyWebhook(rawBody, bad)).resolves.toBeNull();
  });

  it("verifyWebhook rejects stale timestamps", async () => {
    const ts = 1_700_000_000;
    const rawBody = JSON.stringify({
      event_id: "e",
      event_type: "x",
      data: null,
    });
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
      toleranceSeconds: 60,
      now: () => (ts + 3600) * 1000, // 1h later
    });
    const header = signPaddle("whsec", ts, rawBody);
    await expect(payments.verifyWebhook(rawBody, header)).resolves.toBeNull();
  });

  it("verifyWebhook rejects malformed signature headers", async () => {
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
    });
    await expect(payments.verifyWebhook("{}", "nope")).resolves.toBeNull();
    await expect(payments.verifyWebhook("{}", "ts=;h1=")).resolves.toBeNull();
    await expect(
      payments.verifyWebhook("{}", "ts=abc;h1=xx"),
    ).resolves.toBeNull();
  });

  it("verifyWebhook returns null on body that's not JSON", async () => {
    const ts = 1_700_000_000;
    const rawBody = "not-json";
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
      now: () => ts * 1000,
    });
    const header = signPaddle("whsec", ts, rawBody);
    await expect(payments.verifyWebhook(rawBody, header)).resolves.toBeNull();
  });

  it("verifyWebhook rejects payloads missing event_id or event_type", async () => {
    const ts = 1_700_000_000;
    const rawBody = JSON.stringify({ data: { foo: "bar" } });
    const payments = new PaddlePayments({
      client: makeClient(),
      webhookSecret: "whsec",
      now: () => ts * 1000,
    });
    const header = signPaddle("whsec", ts, rawBody);
    await expect(payments.verifyWebhook(rawBody, header)).resolves.toBeNull();
  });
});

describe("createFetchPaddleClient", () => {
  it("POSTs to /transactions with bearer auth and returns the checkout URL", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              id: "txn_abc",
              checkout: { url: "https://paddle.test/c/abc" },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    const client = createFetchPaddleClient({ apiKey: "pdl-key", fetcher });
    const result = await client.createTransaction({
      items: [{ priceId: "pri_1", quantity: 2 }],
      successUrl: "http://ok",
      customerEmail: "u@example.com",
      metadata: { k: "v" },
    });
    expect(result).toEqual({
      id: "txn_abc",
      checkout: { url: "https://paddle.test/c/abc" },
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.paddle.com/transactions");
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer pdl-key",
    );
    const parsed = JSON.parse(
      typeof init.body === "string" ? init.body : "",
    ) as {
      items: { price_id: string; quantity: number }[];
      checkout: { url: string };
      customer?: { email?: string };
      custom_data?: Record<string, string>;
    };
    expect(parsed.items).toEqual([{ price_id: "pri_1", quantity: 2 }]);
    expect(parsed.checkout.url).toBe("http://ok");
    expect(parsed.customer?.email).toBe("u@example.com");
    expect(parsed.custom_data).toEqual({ k: "v" });
  });

  it("throws on non-2xx", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 500 })),
    );
    const client = createFetchPaddleClient({ apiKey: "k", fetcher });
    await expect(
      client.createTransaction({
        items: [{ priceId: "p", quantity: 1 }],
        successUrl: "http://x",
      }),
    ).rejects.toThrow(/500/);
  });
});
