import type {
  Analytics,
  CaptureInput,
  DistinctId,
  UserTraits,
} from "../interfaces.ts";

/**
 * Minimal Mixpanel client surface this adapter needs. The factory wraps
 * the public HTTP ingestion endpoints; tests pass a mocked client.
 */
export interface MixpanelClient {
  track: (event: {
    event: string;
    properties: Record<string, unknown>;
  }) => Promise<void>;
  people: (input: {
    distinctId: string;
    set: Record<string, unknown>;
  }) => Promise<void>;
  flush: () => Promise<void>;
  shutdown: () => Promise<void>;
}

export interface MixpanelAnalyticsOptions {
  client: MixpanelClient;
}

export class MixpanelAnalytics implements Analytics {
  private readonly client: MixpanelClient;

  constructor(options: MixpanelAnalyticsOptions) {
    this.client = options.client;
  }

  capture(input: CaptureInput): void {
    try {
      const properties: Record<string, unknown> = {
        distinct_id: input.distinctId,
        ...(input.properties ?? {}),
      };
      void this.client.track({ event: input.event, properties }).catch(() => {
        /* analytics never throws */
      });
    } catch {
      /* analytics never throws */
    }
  }

  identify(distinctId: DistinctId, traits?: UserTraits): void {
    if (!traits) return;
    try {
      void this.client.people({ distinctId, set: { ...traits } }).catch(() => {
        /* swallow */
      });
    } catch {
      /* swallow */
    }
  }

  reset(): void {
    // Mixpanel's server-side SDK has no per-session state; anonymous
    // distinctId rotation is the caller's responsibility.
  }

  async flush(): Promise<void> {
    try {
      await this.client.flush();
    } catch {
      /* best-effort */
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.shutdown();
    } catch {
      /* best-effort */
    }
  }
}

export interface FetchMixpanelClientOptions {
  token: string;
  /** Default https://api.mixpanel.com; override for EU residency. */
  endpoint?: string;
  fetcher?: typeof fetch;
}

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function createFetchMixpanelClient(
  options: FetchMixpanelClientOptions,
): MixpanelClient {
  const endpoint = options.endpoint ?? "https://api.mixpanel.com";
  const fetcher = options.fetcher ?? fetch;
  const token = options.token;

  return {
    async track({ event, properties }) {
      const body = encodePayload({
        event,
        properties: { ...properties, token },
      });
      await fetcher(`${endpoint}/track`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(body)}`,
      });
    },
    async people({ distinctId, set }) {
      const body = encodePayload({
        $token: token,
        $distinct_id: distinctId,
        $set: set,
      });
      await fetcher(`${endpoint}/engage`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(body)}`,
      });
    },
    flush() {
      return Promise.resolve();
    },
    shutdown() {
      return Promise.resolve();
    },
  };
}
