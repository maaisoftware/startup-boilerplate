import { describe, expect, it, vi } from "vitest";

import { runAnalyticsContract } from "../contract.ts";
import { PostHogAnalytics, type PostHogClient } from "./posthog.ts";

function makeClient(): PostHogClient {
  return {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    flush: vi.fn((): Promise<void> => Promise.resolve()),
    shutdown: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runAnalyticsContract(
  "PostHogAnalytics",
  () => new PostHogAnalytics({ client: makeClient() }),
);

describe("PostHogAnalytics specifics", () => {
  it("forwards capture() to the client with a cloned properties payload", () => {
    const client = makeClient();
    const analytics = new PostHogAnalytics({ client });
    const props = { plan: "pro", count: 3 };
    analytics.capture({
      event: "signup",
      distinctId: "u_1",
      properties: props,
    });
    expect(client.capture).toHaveBeenCalledWith({
      event: "signup",
      distinctId: "u_1",
      properties: { plan: "pro", count: 3 },
    });
    // cloned, not referenced
    const call = vi.mocked(client.capture).mock.calls[0]?.[0];
    expect(call?.properties).not.toBe(props);
  });

  it("omits properties when not provided", () => {
    const client = makeClient();
    new PostHogAnalytics({ client }).capture({ event: "e", distinctId: "u" });
    expect(client.capture).toHaveBeenCalledWith({
      event: "e",
      distinctId: "u",
      properties: undefined,
    });
  });

  it("forwards identify() traits and omits when absent", () => {
    const client = makeClient();
    const analytics = new PostHogAnalytics({ client });
    analytics.identify("u_1", { plan: "free" });
    analytics.identify("u_2");
    expect(client.identify).toHaveBeenNthCalledWith(1, {
      distinctId: "u_1",
      properties: { plan: "free" },
    });
    expect(client.identify).toHaveBeenNthCalledWith(2, {
      distinctId: "u_2",
      properties: undefined,
    });
  });

  it("calls reset on the client", () => {
    const client = makeClient();
    new PostHogAnalytics({ client }).reset();
    expect(client.reset).toHaveBeenCalledTimes(1);
  });

  it("tolerates clients without reset()", () => {
    const client: PostHogClient = {
      capture: vi.fn(),
      identify: vi.fn(),
      flush: vi.fn((): Promise<void> => Promise.resolve()),
      shutdown: vi.fn((): Promise<void> => Promise.resolve()),
    };
    expect(() => new PostHogAnalytics({ client }).reset()).not.toThrow();
  });

  it("flush() awaits client.flush()", async () => {
    const client = makeClient();
    await new PostHogAnalytics({ client }).flush();
    expect(client.flush).toHaveBeenCalledTimes(1);
  });

  it("close() awaits client.shutdown()", async () => {
    const client = makeClient();
    await new PostHogAnalytics({ client }).close();
    expect(client.shutdown).toHaveBeenCalledTimes(1);
  });

  it("swallows errors thrown by the client — never throws", () => {
    const client: PostHogClient = {
      capture: vi.fn((): void => {
        throw new Error("down");
      }),
      identify: vi.fn((): void => {
        throw new Error("down");
      }),
      reset: vi.fn((): void => {
        throw new Error("down");
      }),
      flush: vi.fn((): Promise<void> => Promise.reject(new Error("down"))),
      shutdown: vi.fn((): Promise<void> => Promise.reject(new Error("down"))),
    };
    const analytics = new PostHogAnalytics({ client });
    expect(() =>
      analytics.capture({ event: "e", distinctId: "u" }),
    ).not.toThrow();
    expect(() => analytics.identify("u")).not.toThrow();
    expect(() => analytics.reset()).not.toThrow();
    return Promise.all([
      expect(analytics.flush()).resolves.toBeUndefined(),
      expect(analytics.close()).resolves.toBeUndefined(),
    ]);
  });
});
