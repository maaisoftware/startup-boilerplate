import type {
  Payments,
  PaymentsCheckoutInput,
  PaymentsCheckoutResult,
  PaymentsWebhookEvent,
} from "../interfaces.ts";

/** Zero-op adapter. Active by default; flip PAYMENTS_PROVIDER=stripe to swap. */
export class NoopPayments implements Payments {
  isEnabled(): boolean {
    return false;
  }

  createCheckoutSession(
    _input: PaymentsCheckoutInput,
  ): Promise<PaymentsCheckoutResult> {
    return Promise.resolve({ url: null, sessionId: null });
  }

  verifyWebhook(
    _rawBody: string,
    _signatureHeader: string | null,
  ): Promise<PaymentsWebhookEvent | null> {
    return Promise.resolve(null);
  }
}
