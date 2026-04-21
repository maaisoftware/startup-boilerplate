import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetRateLimitForTests,
  rateLimit,
  sweepExpired,
} from "./rate-limit.ts";

describe("rateLimit", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it("allows calls up to the limit and blocks further ones", () => {
    for (let i = 0; i < 3; i += 1) {
      const result = rateLimit("ip:127.0.0.1", { limit: 3, windowMs: 1000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(3 - i - 1);
    }
    const blocked = rateLimit("ip:127.0.0.1", { limit: 3, windowMs: 1000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("separate identifiers have independent buckets", () => {
    rateLimit("a", { limit: 1, windowMs: 1000 });
    const r = rateLimit("b", { limit: 1, windowMs: 1000 });
    expect(r.success).toBe(true);
  });

  it("resets after the window elapses", async () => {
    rateLimit("x", { limit: 1, windowMs: 10 });
    const blocked = rateLimit("x", { limit: 1, windowMs: 10 });
    expect(blocked.success).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const allowed = rateLimit("x", { limit: 1, windowMs: 10 });
    expect(allowed.success).toBe(true);
  });

  it("sweepExpired removes stale buckets", async () => {
    rateLimit("z", { limit: 5, windowMs: 5 });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const removed = sweepExpired(Date.now());
    expect(removed).toBeGreaterThan(0);
  });
});
