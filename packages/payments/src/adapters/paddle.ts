import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  Payments,
  PaymentsCheckoutInput,
  PaymentsCheckoutResult,
  PaymentsWebhookEvent,
} from "../interfaces.ts";

/**
 * Paddle Billing adapter. Creates a transaction + returns the hosted
 * checkout URL. Webhook verification follows Paddle's Ed25519-free
 * signature scheme: the `Paddle-Signature` header is
 * `ts=<unix>;h1=<hex>` where `h1 = hmac_sha256(secret, "<ts>:<rawBody>")`.
 *
 * See https://developer.paddle.com/webhooks/signature-verification
 */

export interface PaddleTransaction {
  id: string;
  checkout: { url: string | null } | null;
}

export interface PaddleClient {
  createTransaction: (input: {
    items: { priceId: string; quantity: number }[];
    successUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) => Promise<PaddleTransaction>;
}

export interface PaddlePaymentsOptions {
  client: PaddleClient;
  webhookSecret: string;
  /** Clock skew tolerance in seconds (default 5 minutes). */
  toleranceSeconds?: number;
  /** Override in tests. Defaults to `Date.now`. */
  now?: () => number;
}

export class PaddlePayments implements Payments {
  private readonly client: PaddleClient;
  private readonly webhookSecret: string;
  private readonly toleranceSeconds: number;
  private readonly now: () => number;

  constructor(options: PaddlePaymentsOptions) {
    this.client = options.client;
    this.webhookSecret = options.webhookSecret;
    this.toleranceSeconds = options.toleranceSeconds ?? 300;
    this.now = options.now ?? Date.now;
  }

  isEnabled(): boolean {
    return true;
  }

  async createCheckoutSession(
    input: PaymentsCheckoutInput,
  ): Promise<PaymentsCheckoutResult> {
    try {
      const transaction = await this.client.createTransaction({
        items: [{ priceId: input.priceId, quantity: input.quantity ?? 1 }],
        successUrl: input.successUrl,
        ...(input.customerEmail ? { customerEmail: input.customerEmail } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      });
      return {
        url: transaction.checkout?.url ?? null,
        sessionId: transaction.id,
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
      const parsed = parsePaddleSignature(signatureHeader);
      if (!parsed) return Promise.resolve(null);

      const nowSeconds = Math.floor(this.now() / 1000);
      if (Math.abs(nowSeconds - parsed.timestamp) > this.toleranceSeconds) {
        return Promise.resolve(null);
      }

      const expected = createHmac("sha256", this.webhookSecret)
        .update(`${parsed.timestamp}:${rawBody}`)
        .digest("hex");
      if (!constantTimeEqualsHex(expected, parsed.hash)) {
        return Promise.resolve(null);
      }

      const payload = JSON.parse(rawBody) as {
        event_id?: string;
        event_type?: string;
        data?: unknown;
      };
      if (!payload.event_id || !payload.event_type) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id: payload.event_id,
        type: payload.event_type,
        payload: payload.data ?? null,
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}

function parsePaddleSignature(
  header: string,
): { timestamp: number; hash: string } | null {
  let timestamp: number | undefined;
  let hash: string | undefined;
  for (const part of header.split(";")) {
    const [rawKey, rawValue] = part.split("=");
    const key = rawKey?.trim();
    const value = rawValue?.trim();
    if (!key || !value) continue;
    if (key === "ts") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (key === "h1") {
      hash = value;
    }
  }
  if (timestamp === undefined || !hash) return null;
  return { timestamp, hash };
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export interface FetchPaddleClientOptions {
  apiKey: string;
  /** https://api.paddle.com | https://sandbox-api.paddle.com */
  endpoint?: string;
  fetcher?: typeof fetch;
}

/**
 * Builds a minimal Paddle client targeting the Billing API's
 * `POST /transactions` endpoint. Returns the transaction + hosted
 * checkout URL.
 */
export function createFetchPaddleClient(
  options: FetchPaddleClientOptions,
): PaddleClient {
  const endpoint = options.endpoint ?? "https://api.paddle.com";
  const fetcher = options.fetcher ?? fetch;
  const apiKey = options.apiKey;

  return {
    async createTransaction({ items, successUrl, customerEmail, metadata }) {
      const response = await fetcher(`${endpoint}/transactions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            price_id: item.priceId,
            quantity: item.quantity,
          })),
          checkout: { url: successUrl },
          ...(customerEmail ? { customer: { email: customerEmail } } : {}),
          ...(metadata ? { custom_data: metadata } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error(`Paddle createTransaction failed: ${response.status}`);
      }
      const body = (await response.json()) as {
        data: { id: string; checkout: { url: string | null } | null };
      };
      return { id: body.data.id, checkout: body.data.checkout };
    },
  };
}
