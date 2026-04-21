import type {
  Analytics,
  CaptureInput,
  DistinctId,
  UserTraits,
} from "../interfaces.ts";

/**
 * Zero-overhead adapter. Default when `ANALYTICS_PROVIDER=noop` — lets
 * the app run with no external analytics service while still exercising
 * the abstraction everywhere the interface is used.
 *
 * Useful in tests too: assert analytics calls by spying on instance methods.
 */
export class NoopAnalytics implements Analytics {
  capture(_input: CaptureInput): void {
    // intentionally empty
  }

  identify(_distinctId: DistinctId, _traits?: UserTraits): void {
    // intentionally empty
  }

  reset(): void {
    // intentionally empty
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
