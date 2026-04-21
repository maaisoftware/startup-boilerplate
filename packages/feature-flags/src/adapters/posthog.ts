import type { FeatureFlags, FlagContext, FlagKey } from "../interfaces.ts";

/**
 * Minimal shape of the posthog-node client methods this adapter needs.
 * Declared locally so the real SDK is only required at factory time.
 */
export interface PostHogFlagsClient {
  isFeatureEnabled: (
    key: string,
    distinctId: string,
    options?: { personProperties?: Record<string, unknown> },
  ) => Promise<boolean>;
  getFeatureFlag: (
    key: string,
    distinctId: string,
    options?: { personProperties?: Record<string, unknown> },
  ) => Promise<string | boolean | null>;
  shutdown: () => Promise<void>;
}

export interface PostHogFeatureFlagsOptions {
  client: PostHogFlagsClient;
  /** Used when the caller passes no distinctId in context. */
  anonymousId?: string;
}

export class PostHogFeatureFlags implements FeatureFlags {
  private readonly client: PostHogFlagsClient;
  private readonly anonymousId: string;

  constructor(options: PostHogFeatureFlagsOptions) {
    this.client = options.client;
    this.anonymousId = options.anonymousId ?? "anonymous";
  }

  async isEnabled(key: FlagKey, context?: FlagContext): Promise<boolean> {
    try {
      const result = await this.client.isFeatureEnabled(
        key,
        context?.distinctId ?? this.anonymousId,
        context?.traits
          ? { personProperties: { ...context.traits } }
          : undefined,
      );
      return Boolean(result);
    } catch {
      return false;
    }
  }

  async getVariant(
    key: FlagKey,
    context?: FlagContext,
  ): Promise<string | null> {
    try {
      const result = await this.client.getFeatureFlag(
        key,
        context?.distinctId ?? this.anonymousId,
        context?.traits
          ? { personProperties: { ...context.traits } }
          : undefined,
      );
      if (typeof result === "string") return result;
      return null;
    } catch {
      return null;
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
