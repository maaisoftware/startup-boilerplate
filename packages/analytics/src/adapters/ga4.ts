import type {
  Analytics,
  CaptureInput,
  DistinctId,
  UserTraits,
} from "../interfaces.ts";

/**
 * GA4 Measurement Protocol adapter. Sends events to
 * https://www.google-analytics.com/mp/collect. Requires
 * measurement_id (G-XXXXXXXXXX) + api_secret (created in GA4
 * Admin > Data Streams > Measurement Protocol API secrets).
 *
 * GA4 has no people/users table the way Mixpanel does; user traits
 * are attached as user_properties on each event.
 */

export interface GA4Client {
  send: (input: {
    clientId: string;
    userId?: string;
    events: { name: string; params?: Record<string, unknown> }[];
    userProperties?: Record<string, { value: unknown }>;
  }) => Promise<void>;
  flush: () => Promise<void>;
}

export interface GA4AnalyticsOptions {
  client: GA4Client;
}

export class GA4Analytics implements Analytics {
  private readonly client: GA4Client;
  private identifiedProperties: Record<string, { value: unknown }> | undefined;

  constructor(options: GA4AnalyticsOptions) {
    this.client = options.client;
  }

  capture(input: CaptureInput): void {
    try {
      void this.client
        .send({
          clientId: input.distinctId,
          events: [
            {
              name: input.event,
              ...(input.properties ? { params: { ...input.properties } } : {}),
            },
          ],
          ...(this.identifiedProperties
            ? { userProperties: this.identifiedProperties }
            : {}),
        })
        .catch(() => {
          /* analytics never throws */
        });
    } catch {
      /* swallow */
    }
  }

  identify(_distinctId: DistinctId, traits?: UserTraits): void {
    // GA4 attaches user_properties per request; we stash them locally so
    // subsequent capture() calls include them.
    if (!traits) {
      this.identifiedProperties = undefined;
      return;
    }
    const props: Record<string, { value: unknown }> = {};
    for (const [key, value] of Object.entries(traits)) {
      props[key] = { value };
    }
    this.identifiedProperties = props;
  }

  reset(): void {
    this.identifiedProperties = undefined;
  }

  async flush(): Promise<void> {
    try {
      await this.client.flush();
    } catch {
      /* best-effort */
    }
  }

  close(): Promise<void> {
    return this.flush();
  }
}

export interface FetchGA4ClientOptions {
  measurementId: string;
  apiSecret: string;
  /** Override for debug endpoint /debug/mp/collect during local testing. */
  endpoint?: string;
  fetcher?: typeof fetch;
}

export function createFetchGA4Client(
  options: FetchGA4ClientOptions,
): GA4Client {
  const endpoint = options.endpoint ?? "https://www.google-analytics.com";
  const fetcher = options.fetcher ?? fetch;
  const qs = `measurement_id=${encodeURIComponent(
    options.measurementId,
  )}&api_secret=${encodeURIComponent(options.apiSecret)}`;

  return {
    async send({ clientId, userId, events, userProperties }) {
      await fetcher(`${endpoint}/mp/collect?${qs}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          ...(userId ? { user_id: userId } : {}),
          events,
          ...(userProperties ? { user_properties: userProperties } : {}),
        }),
      });
    },
    flush() {
      return Promise.resolve();
    },
  };
}
