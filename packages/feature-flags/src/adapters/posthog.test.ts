import { describe, expect, it, vi } from "vitest";

import { runFeatureFlagsContract } from "../contract.ts";
import { PostHogFeatureFlags, type PostHogFlagsClient } from "./posthog.ts";

function makeClient(): PostHogFlagsClient {
  return {
    isFeatureEnabled: vi.fn((): Promise<boolean> => Promise.resolve(true)),
    getFeatureFlag: vi.fn(
      (): Promise<string | boolean | null> => Promise.resolve("variant-a"),
    ),
    shutdown: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runFeatureFlagsContract(
  "PostHogFeatureFlags",
  () => new PostHogFeatureFlags({ client: makeClient() }),
);

describe("PostHogFeatureFlags specifics", () => {
  it("forwards isEnabled with distinctId from context", async () => {
    const client = makeClient();
    const flags = new PostHogFeatureFlags({ client });
    const result = await flags.isEnabled("admin-ui", { distinctId: "u_1" });
    expect(result).toBe(true);
    expect(client.isFeatureEnabled).toHaveBeenCalledWith(
      "admin-ui",
      "u_1",
      undefined,
    );
  });

  it("uses anonymousId when context distinctId is missing", async () => {
    const client = makeClient();
    const flags = new PostHogFeatureFlags({ client, anonymousId: "anon-x" });
    await flags.isEnabled("admin-ui");
    expect(client.isFeatureEnabled).toHaveBeenCalledWith(
      "admin-ui",
      "anon-x",
      undefined,
    );
  });

  it("passes traits as personProperties when present", async () => {
    const client = makeClient();
    const flags = new PostHogFeatureFlags({ client });
    await flags.isEnabled("admin-ui", {
      distinctId: "u_1",
      traits: { plan: "pro" },
    });
    expect(client.isFeatureEnabled).toHaveBeenCalledWith("admin-ui", "u_1", {
      personProperties: { plan: "pro" },
    });
  });

  it("coerces non-boolean isFeatureEnabled results", async () => {
    const client: PostHogFlagsClient = {
      isFeatureEnabled: vi.fn(
        (): Promise<boolean> => Promise.resolve(null as unknown as boolean),
      ),
      getFeatureFlag: vi.fn(
        (): Promise<string | boolean | null> => Promise.resolve(null),
      ),
      shutdown: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new PostHogFeatureFlags({ client });
    await expect(flags.isEnabled("admin-ui")).resolves.toBe(false);
  });

  it("returns false on client error in isEnabled", async () => {
    const client: PostHogFlagsClient = {
      isFeatureEnabled: vi.fn(
        (): Promise<boolean> => Promise.reject(new Error("ph down")),
      ),
      getFeatureFlag: vi.fn(
        (): Promise<string | boolean | null> => Promise.resolve(null),
      ),
      shutdown: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new PostHogFeatureFlags({ client });
    await expect(flags.isEnabled("admin-ui")).resolves.toBe(false);
  });

  it("getVariant returns the string value when the flag has a variant", async () => {
    const client = makeClient();
    const flags = new PostHogFeatureFlags({ client });
    await expect(
      flags.getVariant("admin-ui", { distinctId: "u_1" }),
    ).resolves.toBe("variant-a");
  });

  it("getVariant returns null when the value is boolean", async () => {
    const client: PostHogFlagsClient = {
      isFeatureEnabled: vi.fn((): Promise<boolean> => Promise.resolve(true)),
      getFeatureFlag: vi.fn(
        (): Promise<string | boolean | null> => Promise.resolve(true),
      ),
      shutdown: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new PostHogFeatureFlags({ client });
    await expect(flags.getVariant("admin-ui")).resolves.toBeNull();
  });

  it("getVariant returns null on client error", async () => {
    const client: PostHogFlagsClient = {
      isFeatureEnabled: vi.fn((): Promise<boolean> => Promise.resolve(false)),
      getFeatureFlag: vi.fn(
        (): Promise<string | boolean | null> => Promise.reject(new Error("x")),
      ),
      shutdown: vi.fn((): Promise<void> => Promise.resolve()),
    };
    const flags = new PostHogFeatureFlags({ client });
    await expect(flags.getVariant("admin-ui")).resolves.toBeNull();
  });

  it("close() calls client.shutdown", async () => {
    const client = makeClient();
    await new PostHogFeatureFlags({ client }).close();
    expect(client.shutdown).toHaveBeenCalledTimes(1);
  });

  it("close() swallows shutdown errors", async () => {
    const client: PostHogFlagsClient = {
      isFeatureEnabled: vi.fn((): Promise<boolean> => Promise.resolve(false)),
      getFeatureFlag: vi.fn(
        (): Promise<string | boolean | null> => Promise.resolve(null),
      ),
      shutdown: vi.fn((): Promise<void> => Promise.reject(new Error("x"))),
    };
    await expect(
      new PostHogFeatureFlags({ client }).close(),
    ).resolves.toBeUndefined();
  });
});
