import type {
  Payments,
  PaymentsCheckoutInput,
  PaymentsCheckoutResult,
  PaymentsWebhookEvent,
} from "../interfaces.ts";

/**
 * Minimal Stripe client shape used by this adapter. Declared locally so
 * the package can be unit-tested without the real `stripe` SDK mounted.
 */
export interface StripeClient {
  checkout: {
    sessions: {
      create: (
        input: Record<string, unknown>,
      ) => Promise<{ id: string; url: string | null }>;
    };
  };
  webhooks: {
    constructEventAsync: (
      body: string,
      signature: string,
      secret: string,
    ) => Promise<{ id: string; type: string; data: { object: unknown } }>;
  };
}

export interface StripePaymentsOptions {
  client: StripeClient;
  webhookSecret: string;
}

export class StripePayments implements Payments {
  private readonly client: StripeClient;
  private readonly webhookSecret: string;

  constructor(options: StripePaymentsOptions) {
    this.client = options.client;
    this.webhookSecret = options.webhookSecret;
  }

  isEnabled(): boolean {
    return true;
  }

  async createCheckoutSession(
    input: PaymentsCheckoutInput,
  ): Promise<PaymentsCheckoutResult> {
    try {
      const session = await this.client.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: input.priceId, quantity: input.quantity ?? 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      });
      return { url: session.url, sessionId: session.id };
    } catch {
      // Payments must never throw — surface the failure as a null result.
      return { url: null, sessionId: null };
    }
  }

  async verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<PaymentsWebhookEvent | null> {
    if (!signatureHeader) return null;
    try {
      const event = await this.client.webhooks.constructEventAsync(
        rawBody,
        signatureHeader,
        this.webhookSecret,
      );
      return { id: event.id, type: event.type, payload: event.data.object };
    } catch {
      return null;
    }
  }
}
