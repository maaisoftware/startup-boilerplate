import { getServerEnv } from "@startup-boilerplate/env/server";

import {
  createFetchLemonSqueezyClient,
  LemonSqueezyPayments,
} from "./adapters/lemonsqueezy.ts";
import { NoopPayments } from "./adapters/noop.ts";
import { createFetchPaddleClient, PaddlePayments } from "./adapters/paddle.ts";
import { StripePayments, type StripeClient } from "./adapters/stripe.ts";
import type { Payments } from "./interfaces.ts";

let cached: Payments | undefined;

export async function getPayments(): Promise<Payments> {
  if (cached) return cached;
  const env = getServerEnv();
  if (
    env.PAYMENTS_PROVIDER === "stripe" &&
    env.STRIPE_SECRET_KEY &&
    env.STRIPE_WEBHOOK_SECRET
  ) {
    type StripeCtor = new (
      key: string,
      options?: { apiVersion?: string },
    ) => StripeClient;
    const Stripe = (await import("stripe")).default as unknown as StripeCtor;
    const client = new Stripe(env.STRIPE_SECRET_KEY);
    cached = new StripePayments({
      client,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });
    return cached;
  }

  if (
    env.PAYMENTS_PROVIDER === "paddle" &&
    env.PADDLE_API_KEY &&
    env.PADDLE_WEBHOOK_SECRET
  ) {
    const client = createFetchPaddleClient({
      apiKey: env.PADDLE_API_KEY,
      ...(env.PADDLE_ENDPOINT ? { endpoint: env.PADDLE_ENDPOINT } : {}),
    });
    cached = new PaddlePayments({
      client,
      webhookSecret: env.PADDLE_WEBHOOK_SECRET,
    });
    return cached;
  }

  if (
    env.PAYMENTS_PROVIDER === "lemonsqueezy" &&
    env.LEMONSQUEEZY_API_KEY &&
    env.LEMONSQUEEZY_WEBHOOK_SECRET &&
    env.LEMONSQUEEZY_STORE_ID
  ) {
    const client = createFetchLemonSqueezyClient({
      apiKey: env.LEMONSQUEEZY_API_KEY,
    });
    cached = new LemonSqueezyPayments({
      client,
      webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET,
      storeId: env.LEMONSQUEEZY_STORE_ID,
    });
    return cached;
  }

  cached = new NoopPayments();
  return cached;
}

export function __resetPaymentsCacheForTests(): void {
  cached = undefined;
}
