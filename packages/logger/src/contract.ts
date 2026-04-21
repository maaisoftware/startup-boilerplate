import { describe, expect, it, vi } from "vitest";

import type { Logger } from "./interfaces.ts";

/**
 * Shared contract test suite. Every Logger adapter runs this suite to
 * guarantee interface fidelity. New adapters that fail any case are not
 * acceptable — the abstraction depends on uniform behaviour.
 *
 * Usage from an adapter test:
 *
 *   runLoggerContract("ConsoleLogger", () => new ConsoleLogger());
 */
export function runLoggerContract(name: string, create: () => Logger): void {
  describe(`${name} — Logger contract`, () => {
    it("respects setLevel (records below threshold are dropped)", () => {
      const log = create();
      const originalInfo = console.info;
      const calls: string[] = [];
      console.info = ((line: string): void => {
        calls.push(line);
      }) as typeof console.info;
      try {
        log.setLevel("error");
        log.info("should not emit");
        log.debug("should not emit");
      } finally {
        console.info = originalInfo;
      }
      expect(calls.filter((l) => l.includes("should not emit"))).toHaveLength(
        0,
      );
    });

    it("getLevel round-trips setLevel", () => {
      const log = create();
      log.setLevel("warn");
      expect(log.getLevel()).toBe("warn");
      log.setLevel("debug");
      expect(log.getLevel()).toBe("debug");
    });

    it("child() returns a new Logger with merged context", () => {
      const log = create();
      const scoped = log.child({ requestId: "abc" });
      expect(scoped).not.toBe(log);
      // Must be a full Logger — all members callable
      expect(typeof scoped.info).toBe("function");
      expect(typeof scoped.child).toBe("function");
      expect(typeof scoped.flush).toBe("function");
    });

    it("never throws out of a log call — even with circular context", () => {
      const log = create();
      const circular: Record<string, unknown> = {};
      circular["self"] = circular;
      expect(() => log.info("with circular", circular)).not.toThrow();
      expect(() => log.error("with circular", circular)).not.toThrow();
    });

    it("accepts Error objects in error()", () => {
      const log = create();
      expect(() => log.error(new Error("boom"))).not.toThrow();
    });

    it("flush() resolves to void", async () => {
      const log = create();
      await expect(log.flush()).resolves.toBeUndefined();
    });

    it("log() dispatches by level to the correct method", () => {
      const log = create();
      const spyInfo = vi.spyOn(log, "info" as keyof Logger);
      // Logger.log must handle all levels without throwing
      expect(() => log.log("debug", "d")).not.toThrow();
      expect(() => log.log("info", "i")).not.toThrow();
      expect(() => log.log("warn", "w")).not.toThrow();
      expect(() => log.log("error", "e")).not.toThrow();
      spyInfo.mockRestore();
    });
  });
}
