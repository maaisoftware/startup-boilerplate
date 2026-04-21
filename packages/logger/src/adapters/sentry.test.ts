import { describe, expect, it, vi } from "vitest";

import { runLoggerContract } from "../contract.ts";
import { SentryLogger, type SentryClient } from "./sentry.ts";

function makeClient(): SentryClient {
  return {
    init: vi.fn(),
    captureException: vi.fn((): string => "event-id"),
    captureMessage: vi.fn((): string => "event-id"),
    addBreadcrumb: vi.fn(),
    flush: vi.fn((): Promise<boolean> => Promise.resolve(true)),
  };
}

runLoggerContract(
  "SentryLogger",
  () => new SentryLogger({ client: makeClient(), level: "debug" }),
);

describe("SentryLogger specifics", () => {
  it("routes debug/info to breadcrumbs", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "debug" });
    log.debug("d", { userId: "u" });
    log.info("i", { userId: "u" });
    expect(client.addBreadcrumb).toHaveBeenCalledTimes(2);
    expect(client.captureMessage).not.toHaveBeenCalled();
    expect(client.captureException).not.toHaveBeenCalled();
  });

  it("routes warn to captureMessage with level 'warning'", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "debug" });
    log.warn("w", { foo: 1 });
    expect(client.captureMessage).toHaveBeenCalledWith(
      "w",
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({ foo: 1 }),
      }),
    );
  });

  it("routes error strings to captureMessage with level 'error'", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "debug" });
    log.error("crashed");
    expect(client.captureMessage).toHaveBeenCalledWith(
      "crashed",
      expect.objectContaining({ level: "error" }),
    );
  });

  it("routes Error instances to captureException", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "debug" });
    const err = new Error("boom");
    log.error(err, { url: "/api/x" });
    expect(client.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        extra: expect.objectContaining({ url: "/api/x" }),
      }),
    );
  });

  it("swallows client exceptions — logging never throws", () => {
    const client: SentryClient = {
      captureException: vi.fn((): string => {
        throw new Error("sentry down");
      }),
      captureMessage: vi.fn((): string => {
        throw new Error("sentry down");
      }),
      addBreadcrumb: vi.fn((): void => {
        throw new Error("sentry down");
      }),
      flush: vi.fn((): Promise<boolean> => Promise.resolve(true)),
    };
    const log = new SentryLogger({ client, level: "debug" });
    expect(() => log.info("x")).not.toThrow();
    expect(() => log.warn("x")).not.toThrow();
    expect(() => log.error("x")).not.toThrow();
    expect(() => log.error(new Error("y"))).not.toThrow();
  });

  it("flush() awaits the Sentry flush with a 2-second timeout", async () => {
    const client = makeClient();
    const log = new SentryLogger({ client });
    await log.flush();
    expect(client.flush).toHaveBeenCalledWith(2000);
  });

  it("child() carries the same client and merges context", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "debug", context: { a: 1 } });
    const scoped = log.child({ b: 2 });
    scoped.warn("x");
    expect(client.captureMessage).toHaveBeenCalledWith(
      "x",
      expect.objectContaining({
        extra: expect.objectContaining({ a: 1, b: 2 }),
      }),
    );
  });

  it("drops records below the configured level silently", () => {
    const client = makeClient();
    const log = new SentryLogger({ client, level: "warn" });
    log.debug("d");
    log.info("i");
    expect(client.addBreadcrumb).not.toHaveBeenCalled();
    expect(client.captureMessage).not.toHaveBeenCalled();
  });
});
