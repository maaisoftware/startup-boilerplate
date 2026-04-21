import { getServerEnv } from "@startup-boilerplate/env/server";

import { NoopAnalytics } from "./adapters/noop.ts";
import { PostHogAnalytics, type PostHogClient } from "./adapters/posthog.ts";
import type { Analytics } from "./interfaces.ts";

let cached: Analytics | undefined;

/**
 * Returns the configured analytics singleton based on `ANALYTICS_PROVIDER`.
 * Defaults to Noop when no provider-specific env vars are present.
 *
 * PostHog client is dynamically imported so the server bundle only
 * pulls `posthog-node` when actually selected.
 */
export async function getAnalytics(): Promise<Analytics> {
  if (cached) return cached;

  const env = getServerEnv();
  if (env.ANALYTICS_PROVIDER === "posthog" && env.POSTHOG_API_KEY) {
    const { PostHog } = (await import("posthog-node")) as unknown as {
      PostHog: new (
        apiKey: string,
        options?: { host?: string; flushAt?: number },
      ) => PostHogClient;
    };
    const host = (env as unknown as { NEXT_PUBLIC_POSTHOG_HOST?: string })
      .NEXT_PUBLIC_POSTHOG_HOST;
    const flushAt = env.NODE_ENV === "production" ? 20 : 1;
    const client = host
      ? new PostHog(env.POSTHOG_API_KEY, { host, flushAt })
      : new PostHog(env.POSTHOG_API_KEY, { flushAt });
    cached = new PostHogAnalytics({ client });
    return cached;
  }

  cached = new NoopAnalytics();
  return cached;
}

export function __resetAnalyticsCacheForTests(): void {
  cached = undefined;
}
