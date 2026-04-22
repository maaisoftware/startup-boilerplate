import { describe, expect, it, vi } from "vitest";

import { runLoggerContract } from "../contract.ts";
import {
  createFetchDatadogClient,
  DatadogLogger,
  type DatadogClient,
} from "./datadog.ts";

function makeClient(): DatadogClient {
  return {
    submitLog: vi.fn((): Promise<void> => Promise.resolve()),
    flush: vi.fn((): Promise<void> => Promise.resolve()),
  };
}

runLoggerContract(
  "DatadogLogger",
  () => new DatadogLogger({ client: makeClient(), level: "debug" }),
);

describe("DatadogLogger specifics", () => {
  it("submits each level with the matching Datadog status", async () => {
    const client = makeClient();
    const log = new DatadogLogger({ client, level: "debug" });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    // Fire-and-forget; yield microtasks so the promises settle.
    await Promise.resolve();
    expect(client.submitLog).toHaveBeenCalledTimes(4);
    const statuses = (
      client.submitLog as unknown as { mock: { calls: [{ status: string }][] } }
    ).mock.calls.map(([entry]) => entry.status);
    expect(statuses).toEqual(["debug", "info", "warn", "error"]);
  });

  it("attaches service and env tags via ddtags", () => {
    const client = makeClient();
    const log = new DatadogLogger({
      client,
      level: "debug",
      service: "web",
      env: "production",
    });
    log.info("request");
    const submit = client.submitLog as unknown as {
      mock: { calls: [{ ddtags?: string }][] };
    };
    const entry = submit.mock.calls[0]?.[0];
    expect(entry?.ddtags).toBe("service:web,env:production");
  });

  it("includes bound context via child()", () => {
    const client = makeClient();
    const root = new DatadogLogger({ client, level: "debug" });
    const scoped = root.child({ requestId: "r-1" });
    scoped.info("event", { userId: "u-1" });
    const submit = client.submitLog as unknown as {
      mock: { calls: [{ requestId?: string; userId?: string }][] };
    };
    const entry = submit.mock.calls[0]?.[0];
    expect(entry?.requestId).toBe("r-1");
    expect(entry?.userId).toBe("u-1");
  });

  it("attaches Error name and stack when calling error(Error)", () => {
    const client = makeClient();
    const log = new DatadogLogger({ client, level: "debug" });
    log.error(new Error("boom"));
    const submit = client.submitLog as unknown as {
      mock: {
        calls: [
          { message: string; error?: { name?: string; stack?: string } },
        ][];
      };
    };
    const entry = submit.mock.calls[0]?.[0];
    expect(entry?.message).toBe("boom");
    expect(entry?.error?.name).toBe("Error");
    expect(typeof entry?.error?.stack).toBe("string");
  });

  it("swallows client errors — logging never throws", () => {
    const client: DatadogClient = {
      submitLog: vi.fn(
        (): Promise<void> => Promise.reject(new Error("dd down")),
      ),
      flush: vi.fn((): Promise<void> => Promise.reject(new Error("dd down"))),
    };
    const log = new DatadogLogger({ client, level: "debug" });
    expect(() => log.info("x")).not.toThrow();
    expect(() => log.error(new Error("y"))).not.toThrow();
  });

  it("respects setLevel — debug messages skip submit when level is warn", () => {
    const client = makeClient();
    const log = new DatadogLogger({ client, level: "debug" });
    log.setLevel("warn");
    log.debug("nope");
    log.info("nope");
    log.warn("yes");
    expect(client.submitLog).toHaveBeenCalledTimes(1);
  });
});

describe("createFetchDatadogClient", () => {
  it("POSTs to the correct intake endpoint with the api key header", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 202 })),
    );
    const client = createFetchDatadogClient({
      apiKey: "dd-key-123",
      site: "datadoghq.eu",
      fetcher,
    });
    await client.submitLog({ message: "hello", status: "info" });
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://http-intake.logs.datadoghq.eu/api/v2/logs");
    const headers = new Headers(init.headers);
    expect(headers.get("dd-api-key")).toBe("dd-key-123");
    expect(headers.get("content-type")).toBe("application/json");
    expect(init.body).toContain('"message":"hello"');
  });

  it("defaults site to datadoghq.com when unspecified", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 202 })),
    );
    const client = createFetchDatadogClient({
      apiKey: "k",
      fetcher,
    });
    await client.submitLog({ message: "x", status: "info" });
    const url = (fetcher.mock.calls[0] as unknown as [string])[0];
    expect(url).toContain("datadoghq.com");
  });

  it("flush() resolves without a network call", async () => {
    const fetcher = vi.fn();
    const client = createFetchDatadogClient({
      apiKey: "k",
      fetcher,
    });
    await client.flush();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
