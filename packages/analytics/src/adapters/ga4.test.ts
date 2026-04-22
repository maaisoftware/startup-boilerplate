import { describe, expect, it, vi } from "vitest";

import { runAnalyticsContract } from "../contract.ts";
import { createFetchGA4Client, GA4Analytics, type GA4Client } from "./ga4.ts";

function makeClient(): GA4Client {
  return {
    send: vi.fn((): Promise<void> => Promise.resolve()),
    flush: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runAnalyticsContract(
  "GA4Analytics",
  () => new GA4Analytics({ client: makeClient() }),
);

describe("GA4Analytics specifics", () => {
  it("sends one event per capture with distinctId as client_id", async () => {
    const client = makeClient();
    const a = new GA4Analytics({ client });
    a.capture({
      event: "post_created",
      distinctId: "anon-123",
      properties: { slug: "hi" },
    });
    await Promise.resolve();
    expect(client.send).toHaveBeenCalledWith({
      clientId: "anon-123",
      events: [{ name: "post_created", params: { slug: "hi" } }],
    });
  });

  it("identify stores traits; subsequent capture includes user_properties", async () => {
    const client = makeClient();
    const a = new GA4Analytics({ client });
    a.identify("anon-1", { plan: "pro", country: "US" });
    a.capture({ event: "pageview", distinctId: "anon-1" });
    await Promise.resolve();
    const payload = (
      client.send as unknown as {
        mock: {
          calls: [{ userProperties?: Record<string, { value: unknown }> }][];
        };
      }
    ).mock.calls[0]?.[0];
    expect(payload?.userProperties).toEqual({
      plan: { value: "pro" },
      country: { value: "US" },
    });
  });

  it("identify with no traits clears stored props", async () => {
    const client = makeClient();
    const a = new GA4Analytics({ client });
    a.identify("u", { plan: "pro" });
    a.identify("u");
    a.capture({ event: "e", distinctId: "u" });
    await Promise.resolve();
    const payload = (
      client.send as unknown as {
        mock: { calls: [{ userProperties?: unknown }][] };
      }
    ).mock.calls[0]?.[0];
    expect(payload?.userProperties).toBeUndefined();
  });

  it("reset clears stored user properties", async () => {
    const client = makeClient();
    const a = new GA4Analytics({ client });
    a.identify("u", { plan: "pro" });
    a.reset();
    a.capture({ event: "e", distinctId: "u" });
    await Promise.resolve();
    const payload = (
      client.send as unknown as {
        mock: { calls: [{ userProperties?: unknown }][] };
      }
    ).mock.calls[0]?.[0];
    expect(payload?.userProperties).toBeUndefined();
  });

  it("swallows client errors", () => {
    const client: GA4Client = {
      send: vi.fn((): Promise<void> => Promise.reject(new Error("ga4 down"))),
      flush: vi.fn((): Promise<void> => Promise.reject(new Error("ga4 down"))),
    };
    const a = new GA4Analytics({ client });
    expect(() => a.capture({ event: "e", distinctId: "u" })).not.toThrow();
    return expect(a.flush()).resolves.toBeUndefined();
  });
});

describe("createFetchGA4Client", () => {
  it("POSTs to measurement protocol with credentials on the querystring", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    const client = createFetchGA4Client({
      measurementId: "G-ABC",
      apiSecret: "sec!",
      fetcher,
    });
    await client.send({
      clientId: "c1",
      events: [{ name: "e", params: { n: 1 } }],
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-ABC&api_secret=sec!",
    );
    const bodyText = typeof init.body === "string" ? init.body : "";
    const parsed = JSON.parse(bodyText) as {
      client_id: string;
      events: { name: string; params?: Record<string, unknown> }[];
    };
    expect(parsed.client_id).toBe("c1");
    expect(parsed.events[0]?.name).toBe("e");
  });

  it("includes user_id and user_properties when provided", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    const client = createFetchGA4Client({
      measurementId: "G-ABC",
      apiSecret: "s",
      fetcher,
    });
    await client.send({
      clientId: "c1",
      userId: "u-1",
      events: [{ name: "e" }],
      userProperties: { plan: { value: "pro" } },
    });
    const init = (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1];
    const bodyText = typeof init.body === "string" ? init.body : "";
    const parsed = JSON.parse(bodyText) as {
      user_id?: string;
      user_properties?: Record<string, { value: unknown }>;
    };
    expect(parsed.user_id).toBe("u-1");
    expect(parsed.user_properties).toEqual({ plan: { value: "pro" } });
  });
});
