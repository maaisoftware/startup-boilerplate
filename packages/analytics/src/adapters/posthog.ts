import type {
  Analytics,
  CaptureInput,
  DistinctId,
  UserTraits,
} from "../interfaces.ts";

/**
 * Minimal shape of the PostHog server client this adapter consumes.
 * Typing against an interface (rather than the full posthog-node
 * import) lets the package be tested without pulling in the real SDK.
 */
export interface PostHogClient {
  capture: (input: {
    event: string;
    distinctId: string;
    properties?: Record<string, unknown>;
  }) => void;
  identify: (input: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }) => void;
  reset?: () => void;
  flush: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export interface PostHogAnalyticsOptions {
  client: PostHogClient;
}

export class PostHogAnalytics implements Analytics {
  private readonly client: PostHogClient;

  constructor(options: PostHogAnalyticsOptions) {
    this.client = options.client;
  }

  capture(input: CaptureInput): void {
    try {
      this.client.capture({
        event: input.event,
        distinctId: input.distinctId,
        ...(input.properties ? { properties: { ...input.properties } } : {}),
      });
    } catch {
      // Analytics must never throw.
    }
  }

  identify(distinctId: DistinctId, traits?: UserTraits): void {
    try {
      this.client.identify({
        distinctId,
        ...(traits ? { properties: { ...traits } } : {}),
      });
    } catch {
      // Analytics must never throw.
    }
  }

  reset(): void {
    try {
      this.client.reset?.();
    } catch {
      // Analytics must never throw.
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flush();
    } catch {
      // best-effort
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.shutdown();
    } catch {
      // best-effort
    }
  }
}
