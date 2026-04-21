import { describe, expect, it } from "vitest";

import { runFeatureFlagsContract } from "../contract.ts";
import { EnvFeatureFlags } from "./env.ts";

runFeatureFlagsContract(
  "EnvFeatureFlags",
  () => new EnvFeatureFlags({ source: { FEATURE_ADMIN_UI: "true" } }),
);

describe("EnvFeatureFlags specifics", () => {
  it("reads string 'true' as enabled", () => {
    const flags = new EnvFeatureFlags({ source: { FEATURE_ADMIN_UI: "true" } });
    expect(flags.isEnabled("admin-ui")).toBe(true);
  });

  it("reads string 'false' as disabled", () => {
    const flags = new EnvFeatureFlags({
      source: { FEATURE_ADMIN_UI: "false" },
    });
    expect(flags.isEnabled("admin-ui")).toBe(false);
  });

  it("reads boolean values directly (validated env schema path)", () => {
    const flags = new EnvFeatureFlags({
      source: { FEATURE_ADMIN_UI: true, FEATURE_NEWSLETTER: false },
    });
    expect(flags.isEnabled("admin-ui")).toBe(true);
    expect(flags.isEnabled("newsletter")).toBe(false);
  });

  it("returns false for unknown / missing keys", () => {
    const flags = new EnvFeatureFlags({ source: {} });
    expect(flags.isEnabled("admin-ui")).toBe(false);
    expect(flags.isEnabled("stripe-checkout")).toBe(false);
  });

  it("maps hyphenated keys to SCREAMING_SNAKE env vars", () => {
    const flags = new EnvFeatureFlags({
      source: { FEATURE_STRIPE_CHECKOUT: "true" },
    });
    expect(flags.isEnabled("stripe-checkout")).toBe(true);
  });

  it("getVariant always returns null (env adapter is boolean-only)", () => {
    const flags = new EnvFeatureFlags({ source: { FEATURE_ADMIN_UI: "true" } });
    expect(flags.getVariant("admin-ui")).toBeNull();
  });

  it("close() is a resolved promise no-op", async () => {
    const flags = new EnvFeatureFlags({ source: {} });
    await expect(flags.close()).resolves.toBeUndefined();
  });

  it("defaults source to process.env when not provided", () => {
    const original = process.env["FEATURE_ADMIN_UI"];
    process.env["FEATURE_ADMIN_UI"] = "true";
    try {
      const flags = new EnvFeatureFlags();
      expect(flags.isEnabled("admin-ui")).toBe(true);
    } finally {
      if (original === undefined) delete process.env["FEATURE_ADMIN_UI"];
      else process.env["FEATURE_ADMIN_UI"] = original;
    }
  });
});
