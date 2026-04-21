import { describe, expect, it, vi } from "vitest";

import { runAutomationsContract } from "../contract.ts";
import { N8nAutomations } from "./n8n.ts";

const okFetcher: typeof fetch = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({ executionId: "exec_1" }), { status: 200 }),
  ),
);

runAutomationsContract(
  "N8nAutomations",
  () =>
    new N8nAutomations({
      webhookUrl: "http://n8n.test/hook",
      webhookSecret: "s",
      fetcher: okFetcher,
    }),
);

describe("N8nAutomations specifics", () => {
  it("POSTs the payload with the secret header", async () => {
    const spy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ executionId: "exec_42" }), {
          status: 200,
        }),
      ),
    );
    const automations = new N8nAutomations({
      webhookUrl: "http://n8n/hook",
      webhookSecret: "sh!",
      fetcher: spy,
    });
    const result = await automations.trigger({
      workflow: "user.signup",
      payload: { userId: "u_1" },
    });
    expect(result.executionId).toBe("exec_42");
    const call = spy.mock.calls[0] as unknown as
      | [string, RequestInit]
      | undefined;
    expect(call).toBeDefined();
    const url = call?.[0];
    const init: RequestInit = call?.[1] ?? {};
    expect(url).toBe("http://n8n/hook");
    const headers = new Headers(init.headers);
    expect(headers.get("x-webhook-secret")).toBe("sh!");
    expect(headers.get("x-workflow")).toBe("user.signup");
    expect(init.body).toBe(JSON.stringify({ userId: "u_1" }));
  });

  it("returns null executionId on non-2xx response", async () => {
    const failFetcher: typeof fetch = vi.fn(() =>
      Promise.resolve(new Response("down", { status: 500 })),
    );
    const r = await new N8nAutomations({
      webhookUrl: "http://x",
      webhookSecret: "s",
      fetcher: failFetcher,
    }).trigger({ workflow: "w", payload: {} });
    expect(r.executionId).toBeNull();
  });

  it("swallows network errors", async () => {
    const throwFetcher: typeof fetch = vi.fn(() =>
      Promise.reject(new Error("net")),
    );
    const r = await new N8nAutomations({
      webhookUrl: "http://x",
      webhookSecret: "s",
      fetcher: throwFetcher,
    }).trigger({ workflow: "w", payload: {} });
    expect(r.executionId).toBeNull();
  });
});
