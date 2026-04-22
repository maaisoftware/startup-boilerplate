import { describe, expect, it, vi } from "vitest";

import { runFeatureFlagsContract } from "../contract.ts";
import {
  createFetchLaunchDarklyClient,
  LaunchDarklyFeatureFlags,
  type LaunchDarklyClient,
} from "./launchdarkly.ts";

function makeClient(): LaunchDarklyClient {
  return {
    variation: vi.fn((): Promise<boolean> => Promise.resolve(true)),
    stringVariation: vi.fn(
      (): Promise<string | null> => Promise.resolve("variant-a"),
    ),
    close: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runFeatureFlagsContract(
  "LaunchDarklyFeatureFlags",
  () => new LaunchDarklyFeatureFlags({ client: makeClient() }),
);

describe("LaunchDarklyFeatureFlags specifics", () => {
  it("forwards isEnabled with distinctId as context.key", async () => {
    const client = makeClient();
    const flags = new LaunchDarklyFeatureFlags({ client });
    const result = await flags.isEnabled("admin-ui", { distinctId: "u_1" });
    expect(result).toBe(true);
    expect(client.variation).toHaveBeenCalledWith(
      "admin-ui",
      { key: "u_1" },
      false,
    );
  });

  it("uses anonymousId when context distinctId is missing", async () => {
    const client = makeClient();
    const flags = new LaunchDarklyFeatureFlags({
      client,
      anonymousId: "anon-x",
    });
    await flags.isEnabled("admin-ui");
    expect(client.variation).toHaveBeenCalledWith(
      "admin-ui",
      { key: "anon-x" },
      false,
    );
  });

  it("passes traits as context.custom when present", async () => {
    const client = makeClient();
    const flags = new LaunchDarklyFeatureFlags({ client });
    await flags.isEnabled("admin-ui", {
      distinctId: "u_1",
      traits: { plan: "pro" },
    });
    expect(client.variation).toHaveBeenCalledWith(
      "admin-ui",
      { key: "u_1", custom: { plan: "pro" } },
      false,
    );
  });

  it("coerces non-boolean variation results to boolean", async () => {
    const client: LaunchDarklyClient = {
      variation: vi.fn(
        (): Promise<boolean> => Promise.resolve(null as unknown as boolean),
      ),
      stringVariation: vi.fn(
        (): Promise<string | null> => Promise.resolve(null),
      ),
      close: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new LaunchDarklyFeatureFlags({ client });
    await expect(flags.isEnabled("admin-ui")).resolves.toBe(false);
  });

  it("returns false when variation rejects", async () => {
    const client: LaunchDarklyClient = {
      variation: vi.fn(
        (): Promise<boolean> => Promise.reject(new Error("ld down")),
      ),
      stringVariation: vi.fn(
        (): Promise<string | null> => Promise.resolve(null),
      ),
      close: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new LaunchDarklyFeatureFlags({ client });
    await expect(flags.isEnabled("admin-ui")).resolves.toBe(false);
  });

  it("getVariant returns the string value when the flag has a variant", async () => {
    const client = makeClient();
    const flags = new LaunchDarklyFeatureFlags({ client });
    await expect(
      flags.getVariant("admin-ui", { distinctId: "u_1" }),
    ).resolves.toBe("variant-a");
  });

  it("getVariant returns null when stringVariation resolves to null", async () => {
    const client: LaunchDarklyClient = {
      variation: vi.fn((): Promise<boolean> => Promise.resolve(false)),
      stringVariation: vi.fn(
        (): Promise<string | null> => Promise.resolve(null),
      ),
      close: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new LaunchDarklyFeatureFlags({ client });
    await expect(flags.getVariant("admin-ui")).resolves.toBeNull();
  });

  it("getVariant returns null when stringVariation rejects", async () => {
    const client: LaunchDarklyClient = {
      variation: vi.fn((): Promise<boolean> => Promise.resolve(false)),
      stringVariation: vi.fn(
        (): Promise<string | null> => Promise.reject(new Error("x")),
      ),
      close: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new LaunchDarklyFeatureFlags({ client });
    await expect(flags.getVariant("admin-ui")).resolves.toBeNull();
  });

  it("close() calls client.close", async () => {
    const client = makeClient();
    await new LaunchDarklyFeatureFlags({ client }).close();
    expect(client.close).toHaveBeenCalledTimes(1);
  });

  it("close() swallows client errors", async () => {
    const client: LaunchDarklyClient = {
      variation: vi.fn((): Promise<boolean> => Promise.resolve(false)),
      stringVariation: vi.fn(
        (): Promise<string | null> => Promise.resolve(null),
      ),
      close: vi.fn((): Promise<void> => Promise.reject(new Error("x"))),
    };
    await expect(
      new LaunchDarklyFeatureFlags({ client }).close(),
    ).resolves.toBeUndefined();
  });
});

describe("createFetchLaunchDarklyClient", () => {
  it("evaluates a boolean flag via the LD REST API", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: true }), { status: 200 }),
      ),
    );
    const client = createFetchLaunchDarklyClient({
      sdkKey: "sdk-1234",
      fetcher,
    });
    const result = await client.variation("admin-ui", { key: "u_1" }, false);
    expect(result).toBe(true);
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(
      /^https:\/\/clientsdk\.launchdarkly\.com\/sdk\/evalx\/contexts\/[A-Za-z0-9_-]+\/flags\/admin-ui$/,
    );
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "sdk-1234",
    );
  });

  it("returns the defaultValue when LD returns non-boolean", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: "not-a-bool" }), { status: 200 }),
      ),
    );
    const client = createFetchLaunchDarklyClient({ sdkKey: "s", fetcher });
    await expect(
      client.variation("admin-ui", { key: "u" }, false),
    ).resolves.toBe(false);
  });

  it("returns defaultValue when LD responds non-2xx", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 500 })),
    );
    const client = createFetchLaunchDarklyClient({ sdkKey: "s", fetcher });
    await expect(
      client.variation("admin-ui", { key: "u" }, true),
    ).resolves.toBe(true);
  });

  it("stringVariation returns the string value from LD", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: "variant-b" }), { status: 200 }),
      ),
    );
    const client = createFetchLaunchDarklyClient({ sdkKey: "s", fetcher });
    await expect(
      client.stringVariation("admin-ui", { key: "u" }),
    ).resolves.toBe("variant-b");
  });

  it("stringVariation returns null when the value is not a string", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: true }), { status: 200 }),
      ),
    );
    const client = createFetchLaunchDarklyClient({ sdkKey: "s", fetcher });
    await expect(
      client.stringVariation("admin-ui", { key: "u" }),
    ).resolves.toBeNull();
  });

  it("close resolves without hitting fetch", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    const client = createFetchLaunchDarklyClient({ sdkKey: "s", fetcher });
    await expect(client.close()).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
