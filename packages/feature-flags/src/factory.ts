import { getServerEnv } from "@startup-boilerplate/env/server";

import { EnvFeatureFlags } from "./adapters/env.ts";
import {
  PostHogFeatureFlags,
  type PostHogFlagsClient,
} from "./adapters/posthog.ts";
import type { FeatureFlags } from "./interfaces.ts";

let cached: FeatureFlags | undefined;

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (cached) return cached;

  const env = getServerEnv();
  if (env.FEATURE_FLAGS_PROVIDER === "posthog" && env.POSTHOG_API_KEY) {
    const { PostHog } = (await import("posthog-node")) as unknown as {
      PostHog: new (
        apiKey: string,
        options?: { host?: string },
      ) => PostHogFlagsClient;
    };
    const host = (env as unknown as { NEXT_PUBLIC_POSTHOG_HOST?: string })
      .NEXT_PUBLIC_POSTHOG_HOST;
    const client = host
      ? new PostHog(env.POSTHOG_API_KEY, { host })
      : new PostHog(env.POSTHOG_API_KEY);
    cached = new PostHogFeatureFlags({ client });
    return cached;
  }

  cached = new EnvFeatureFlags({ source: env });
  return cached;
}

export function __resetFeatureFlagsCacheForTests(): void {
  cached = undefined;
}
