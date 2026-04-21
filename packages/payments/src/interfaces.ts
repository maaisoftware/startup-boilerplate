/** Payments abstraction. Adapters must never throw out of happy-path methods. */

export type Currency = "usd" | "eur" | "gbp";

export interface PaymentsCheckoutInput {
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentsCheckoutResult {
  /** Public-facing redirect URL. Null when the provider is disabled (noop). */
  url: string | null;
  /** Provider-specific session id; null for noop. */
  sessionId: string | null;
}

export interface PaymentsWebhookEvent {
  id: string;
  type: string;
  payload: unknown;
}

export interface Payments {
  /** True when the active adapter actually processes real payments. */
  isEnabled(): boolean;
  /** Create a hosted checkout session. Noop returns `{ url: null, sessionId: null }`. */
  createCheckoutSession(
    input: PaymentsCheckoutInput,
  ): Promise<PaymentsCheckoutResult>;
  /**
   * Verify a signed webhook payload. Returns null when the signature is
   * invalid or the adapter is disabled. Never throws.
   */
  verifyWebhook(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<PaymentsWebhookEvent | null>;
}
