import { describe, expect, it } from "vitest";
import { runAutomationsContract } from "../contract.ts";
import { NoopAutomations } from "./noop.ts";

runAutomationsContract("NoopAutomations", () => new NoopAutomations());

describe("NoopAutomations specifics", () => {
  it("isEnabled is false", () => {
    expect(new NoopAutomations().isEnabled()).toBe(false);
  });
  it("trigger returns null executionId", async () => {
    const r = await new NoopAutomations().trigger({
      workflow: "x",
      payload: {},
    });
    expect(r).toEqual({ executionId: null });
  });
});
