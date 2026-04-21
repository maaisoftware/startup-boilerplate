import { getServerEnv } from "@startup-boilerplate/env/server";

import { NoopPayments } from "./adapters/noop.ts";
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
  cached = new NoopPayments();
  return cached;
}

export function __resetPaymentsCacheForTests(): void {
  cached = undefined;
}
