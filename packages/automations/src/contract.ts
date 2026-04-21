import { describe, expect, it } from "vitest";
import type { Automations } from "./interfaces.ts";

export function runAutomationsContract(
  name: string,
  create: () => Automations,
): void {
  describe(`${name} — Automations contract`, () => {
    it("isEnabled returns a boolean", () => {
      expect(typeof create().isEnabled()).toBe("boolean");
    });
    it("trigger resolves without throwing", async () => {
      const r = await create().trigger({ workflow: "x", payload: { a: 1 } });
      expect(r).toHaveProperty("executionId");
    });
  });
}
