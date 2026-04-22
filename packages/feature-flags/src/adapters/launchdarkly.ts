import type { FeatureFlags, FlagContext, FlagKey } from "../interfaces.ts";

/**
 * LaunchDarkly server-side adapter. Maps the subset of the LaunchDarkly
 * SDK / REST API that this codebase uses into a small, mockable client
 * interface. The fetch-based client factory below targets the LD
 * Evaluate-flag REST endpoint so the adapter runs on Edge runtimes as
 * well as Node.
 */

export interface LaunchDarklyClient {
  /** Boolean flag evaluation. Implementations MUST resolve — never reject — returning false on failure. */
  variation: (
    key: string,
    context: { key: string; custom?: Record<string, unknown> },
    defaultValue: boolean,
  ) => Promise<boolean>;
  /** String variation evaluation. Resolves to null when no variant applies. */
  stringVariation: (
    key: string,
    context: { key: string; custom?: Record<string, unknown> },
  ) => Promise<string | null>;
  /** Drain pending events + release resources. */
  close: () => Promise<void>;
}

export interface LaunchDarklyFeatureFlagsOptions {
  client: LaunchDarklyClient;
  /** Used when the caller passes no distinctId in context. */
  anonymousId?: string;
}

export class LaunchDarklyFeatureFlags implements FeatureFlags {
  private readonly client: LaunchDarklyClient;
  private readonly anonymousId: string;

  constructor(options: LaunchDarklyFeatureFlagsOptions) {
    this.client = options.client;
    this.anonymousId = options.anonymousId ?? "anonymous";
  }

  async isEnabled(key: FlagKey, context?: FlagContext): Promise<boolean> {
    try {
      const result = await this.client.variation(
        key,
        this.buildContext(context),
        false,
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
      const result = await this.client.stringVariation(
        key,
        this.buildContext(context),
      );
      return typeof result === "string" ? result : null;
    } catch {
      return null;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // best-effort
    }
  }

  private buildContext(context?: FlagContext): {
    key: string;
    custom?: Record<string, unknown>;
  } {
    const key = context?.distinctId ?? this.anonymousId;
    return context?.traits ? { key, custom: { ...context.traits } } : { key };
  }
}

export interface FetchLaunchDarklyClientOptions {
  sdkKey: string;
  /** Override for EU instance / proxy; defaults to https://clientsdk.launchdarkly.com. */
  endpoint?: string;
  fetcher?: typeof fetch;
}

interface LDEvaluateResponse {
  value: unknown;
}

/**
 * Builds a minimal LaunchDarkly client that hits the server-side Evaluate
 * endpoint. Avoids pulling in `launchdarkly-node-server-sdk` (which requires
 * Node primitives) so the adapter works on Edge runtimes when needed.
 *
 * See https://apidocs.launchdarkly.com/tag/Server-side-flag-evaluation
 */
export function createFetchLaunchDarklyClient(
  options: FetchLaunchDarklyClientOptions,
): LaunchDarklyClient {
  const endpoint = options.endpoint ?? "https://clientsdk.launchdarkly.com";
  const fetcher = options.fetcher ?? fetch;
  const sdkKey = options.sdkKey;

  async function evaluate(
    flagKey: string,
    context: { key: string; custom?: Record<string, unknown> },
  ): Promise<unknown> {
    const contextB64 = Buffer.from(
      JSON.stringify({ kind: "user", ...context }),
      "utf8",
    ).toString("base64url");
    const response = await fetcher(
      `${endpoint}/sdk/evalx/contexts/${contextB64}/flags/${encodeURIComponent(flagKey)}`,
      {
        method: "GET",
        headers: { authorization: sdkKey },
      },
    );
    if (!response.ok) return undefined;
    const body = (await response.json()) as LDEvaluateResponse;
    return body.value;
  }

  return {
    async variation(key, context, defaultValue) {
      const value = await evaluate(key, context);
      return typeof value === "boolean" ? value : defaultValue;
    },
    async stringVariation(key, context) {
      const value = await evaluate(key, context);
      return typeof value === "string" ? value : null;
    },
    close() {
      return Promise.resolve();
    },
  };
}
