import { describe, expect, it, vi } from "vitest";

import { runAnalyticsContract } from "../contract.ts";
import {
  createFetchMixpanelClient,
  MixpanelAnalytics,
  type MixpanelClient,
} from "./mixpanel.ts";

function makeClient(): MixpanelClient {
  return {
    track: vi.fn((): Promise<void> => Promise.resolve()),
    people: vi.fn((): Promise<void> => Promise.resolve()),
    flush: vi.fn((): Promise<void> => Promise.resolve()),
    shutdown: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runAnalyticsContract(
  "MixpanelAnalytics",
  () => new MixpanelAnalytics({ client: makeClient() }),
);

describe("MixpanelAnalytics specifics", () => {
  it("forwards capture to client.track with distinct_id merged", async () => {
    const client = makeClient();
    const a = new MixpanelAnalytics({ client });
    a.capture({
      event: "post_created",
      distinctId: "u-1",
      properties: { slug: "hello" },
    });
    await Promise.resolve();
    expect(client.track).toHaveBeenCalledWith({
      event: "post_created",
      properties: { slug: "hello", distinct_id: "u-1" },
    });
  });

  it("forwards identify traits through client.people", async () => {
    const client = makeClient();
    new MixpanelAnalytics({ client }).identify("u-1", { plan: "pro" });
    await Promise.resolve();
    expect(client.people).toHaveBeenCalledWith({
      distinctId: "u-1",
      set: { plan: "pro" },
    });
  });

  it("skips identify when traits are not provided", () => {
    const client = makeClient();
    new MixpanelAnalytics({ client }).identify("u-1");
    expect(client.people).not.toHaveBeenCalled();
  });

  it("swallows client errors", () => {
    const client: MixpanelClient = {
      track: vi.fn((): Promise<void> => Promise.reject(new Error("mp down"))),
      people: vi.fn((): Promise<void> => Promise.reject(new Error("mp down"))),
      flush: vi.fn((): Promise<void> => Promise.reject(new Error("mp down"))),
      shutdown: vi.fn(
        (): Promise<void> => Promise.reject(new Error("mp down")),
      ),
    };
    const a = new MixpanelAnalytics({ client });
    expect(() => a.capture({ event: "e", distinctId: "u" })).not.toThrow();
    expect(() => a.identify("u", { plan: "x" })).not.toThrow();
    return Promise.all([
      expect(a.flush()).resolves.toBeUndefined(),
      expect(a.close()).resolves.toBeUndefined(),
    ]);
  });

  it("flush + close call their respective client methods", async () => {
    const client = makeClient();
    const a = new MixpanelAnalytics({ client });
    await a.flush();
    await a.close();
    expect(client.flush).toHaveBeenCalledTimes(1);
    expect(client.shutdown).toHaveBeenCalledTimes(1);
  });
});

describe("createFetchMixpanelClient", () => {
  it("POSTs base64-encoded events to /track with the token", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("1", { status: 200 })),
    );
    const client = createFetchMixpanelClient({ token: "mp-token", fetcher });
    await client.track({ event: "e", properties: { a: 1 } });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.mixpanel.com/track");
    expect(init.method).toBe("POST");
    const bodyText = typeof init.body === "string" ? init.body : "";
    expect(bodyText).toMatch(/^data=/);
    // Decode and verify token was embedded.
    const encoded = decodeURIComponent(bodyText.slice("data=".length));
    const decoded = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf8"),
    ) as { event: string; properties: { token: string; a: number } };
    expect(decoded.event).toBe("e");
    expect(decoded.properties.token).toBe("mp-token");
    expect(decoded.properties.a).toBe(1);
  });

  it("people posts to /engage with $distinct_id and $set", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("1", { status: 200 })),
    );
    const client = createFetchMixpanelClient({ token: "t", fetcher });
    await client.people({ distinctId: "u-1", set: { plan: "pro" } });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.mixpanel.com/engage");
    const bodyText = typeof init.body === "string" ? init.body : "";
    const encoded = decodeURIComponent(bodyText.slice("data=".length));
    const decoded = JSON.parse(
      Buffer.from(encoded, "base64").toString("utf8"),
    ) as {
      $token: string;
      $distinct_id: string;
      $set: Record<string, unknown>;
    };
    expect(decoded.$distinct_id).toBe("u-1");
    expect(decoded.$set).toEqual({ plan: "pro" });
  });
});
