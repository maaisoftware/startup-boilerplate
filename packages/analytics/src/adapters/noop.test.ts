import { describe, expect, it } from "vitest";

import { runAnalyticsContract } from "../contract.ts";
import { NoopAnalytics } from "./noop.ts";

runAnalyticsContract("NoopAnalytics", () => new NoopAnalytics());

describe("NoopAnalytics", () => {
  it("ignores every call", () => {
    const a = new NoopAnalytics();
    expect(() => {
      a.capture({ event: "x", distinctId: "u" });
      a.identify("u", { plan: "pro" });
      a.reset();
    }).not.toThrow();
  });
});
