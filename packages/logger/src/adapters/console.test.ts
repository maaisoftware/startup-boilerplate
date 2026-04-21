import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runLoggerContract } from "../contract.ts";
import { ConsoleLogger } from "./console.ts";

runLoggerContract("ConsoleLogger", () => new ConsoleLogger({ level: "debug" }));

describe("ConsoleLogger specifics", () => {
  const streams: {
    info: string[];
    warn: string[];
    error: string[];
    debug: string[];
  } = {
    info: [],
    warn: [],
    error: [],
    debug: [],
  };

  beforeEach(() => {
    streams.info = [];
    streams.warn = [];
    streams.error = [];
    streams.debug = [];
    vi.spyOn(console, "info").mockImplementation((line: unknown): void => {
      streams.info.push(String(line));
    });
    vi.spyOn(console, "warn").mockImplementation((line: unknown): void => {
      streams.warn.push(String(line));
    });
    vi.spyOn(console, "error").mockImplementation((line: unknown): void => {
      streams.error.push(String(line));
    });
    vi.spyOn(console, "debug").mockImplementation((line: unknown): void => {
      streams.debug.push(String(line));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes each level to the matching console.* stream", () => {
    const log = new ConsoleLogger({ level: "debug" });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(streams.debug).toHaveLength(1);
    expect(streams.info).toHaveLength(1);
    expect(streams.warn).toHaveLength(1);
    expect(streams.error).toHaveLength(1);
  });

  it("serializes context into the record", () => {
    const log = new ConsoleLogger({ level: "debug" });
    log.info("hello", { userId: "u_1", count: 3 });
    const [record] = streams.info;
    if (!record) throw new Error("expected a record");
    const parsed = JSON.parse(record) as Record<string, unknown>;
    expect(parsed["level"]).toBe("info");
    expect(parsed["msg"]).toBe("hello");
    expect(parsed["userId"]).toBe("u_1");
    expect(parsed["count"]).toBe(3);
    expect(typeof parsed["ts"]).toBe("string");
  });

  it("child() merges context into subsequent records", () => {
    const log = new ConsoleLogger({ level: "debug" });
    const scoped = log.child({ requestId: "r_1" });
    scoped.info("event", { userId: "u_1" });
    const [record] = streams.info;
    if (!record) throw new Error("expected a record");
    const parsed = JSON.parse(record) as Record<string, unknown>;
    expect(parsed["requestId"]).toBe("r_1");
    expect(parsed["userId"]).toBe("u_1");
  });

  it("error() with an Error attaches stack and name", () => {
    const log = new ConsoleLogger({ level: "debug" });
    log.error(new Error("boom"));
    const [record] = streams.error;
    if (!record) throw new Error("expected a record");
    const parsed = JSON.parse(record) as Record<string, unknown>;
    expect(parsed["msg"]).toBe("boom");
    const errorField = parsed["error"] as Record<string, unknown>;
    expect(errorField["name"]).toBe("Error");
    expect(typeof errorField["stack"]).toBe("string");
  });

  it("handles bigint values in context without throwing", () => {
    const log = new ConsoleLogger({ level: "debug" });
    expect(() =>
      log.info("big", { n: BigInt("9007199254740993") }),
    ).not.toThrow();
    const [record] = streams.info;
    if (!record) throw new Error("expected a record");
    expect(record).toContain("9007199254740993");
  });

  it("defaults level to 'info' when not provided", () => {
    const log = new ConsoleLogger();
    expect(log.getLevel()).toBe("info");
  });

  it("flush() resolves immediately", async () => {
    const log = new ConsoleLogger();
    await expect(log.flush()).resolves.toBeUndefined();
  });
});
