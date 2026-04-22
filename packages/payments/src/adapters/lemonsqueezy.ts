import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  Payments,
  PaymentsCheckoutInput,
  PaymentsCheckoutResult,
  PaymentsWebhookEvent,
} from "../interfaces.ts";

/**
 * Lemon Squeezy adapter. Creates a checkout session via the
 * `POST /v1/checkouts` endpoint and returns the hosted checkout URL.
 * Webhook verification is `hmac_sha256(secret, rawBody)` hex-encoded in
 * the `X-Signature` header.
 *
 * See https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */

export interface LemonSqueezyCheckout {
  id: string;
  attributes: { url: string | null };
}

export interface LemonSqueezyClient {
  createCheckout: (input: {
    storeId: string;
    variantId: string;
    redirectUrl: string;
    email?: string;
    custom?: Record<string, string>;
  }) => Promise<LemonSqueezyCheckout>;
}

export interface LemonSqueezyPaymentsOptions {
  client: LemonSqueezyClient;
  /** LS webhook "signing secret" configured in the dashboard. */
  webhookSecret: string;
  /** LS store id — checkout priceIds are LS variant ids; the store is tenant-wide. */
  storeId: string;
}

export class LemonSqueezyPayments implements Payments {
  private readonly client: LemonSqueezyClient;
  private readonly webhookSecret: string;
  private readonly storeId: string;

  constructor(options: LemonSqueezyPaymentsOptions) {
    this.client = options.client;
    this.webhookSecret = options.webhookSecret;
    this.storeId = options.storeId;
  }

  isEnabled(): boolean {
    return true;
  }

  async createCheckoutSession(
    input: PaymentsCheckoutInput,
  ): Promise<PaymentsCheckoutResult> {
    try {
      const checkout = await this.client.createCheckout({
        storeId: this.storeId,
        variantId: input.priceId,
        redirectUrl: input.successUrl,
        ...(input.customerEmail ? { email: input.customerEmail } : {}),
        ...(input.metadata ? { custom: input.metadata } : {}),
      });
      return {
        url: checkout.attributes.url,
        sessionId: checkout.id,
      };
    } catch {
      return { url: null, sessionId: null };
    }
  }

  verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<PaymentsWebhookEvent | null> {
    if (!signatureHeader) return Promise.resolve(null);
    try {
      const expected = createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");
      if (!constantTimeEqualsHex(expected, signatureHeader)) {
        return Promise.resolve(null);
      }
      const payload = JSON.parse(rawBody) as {
        meta?: { event_name?: string; webhook_id?: string | number };
        data?: unknown;
      };
      const eventType = payload.meta?.event_name;
      const eventId = payload.meta?.webhook_id;
      if (!eventType || eventId === undefined) return Promise.resolve(null);
      return Promise.resolve({
        id: String(eventId),
        type: eventType,
        payload: payload.data ?? null,
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export interface FetchLemonSqueezyClientOptions {
  apiKey: string;
  /** https://api.lemonsqueezy.com — rarely overridden. */
  endpoint?: string;
  fetcher?: typeof fetch;
}

/**
 * Builds a minimal Lemon Squeezy client hitting `POST /v1/checkouts`.
 */
export function createFetchLemonSqueezyClient(
  options: FetchLemonSqueezyClientOptions,
): LemonSqueezyClient {
  const endpoint = options.endpoint ?? "https://api.lemonsqueezy.com";
  const fetcher = options.fetcher ?? fetch;
  const apiKey = options.apiKey;

  return {
    async createCheckout({ storeId, variantId, redirectUrl, email, custom }) {
      const response = await fetcher(`${endpoint}/v1/checkouts`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/vnd.api+json",
          accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              product_options: { redirect_url: redirectUrl },
              checkout_data: {
                ...(email ? { email } : {}),
                ...(custom ? { custom } : {}),
              },
            },
            relationships: {
              store: { data: { type: "stores", id: storeId } },
              variant: { data: { type: "variants", id: variantId } },
            },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(
          `LemonSqueezy createCheckout failed: ${response.status}`,
        );
      }
      const body = (await response.json()) as {
        data: { id: string; attributes: { url: string | null } };
      };
      return body.data;
    },
  };
}
