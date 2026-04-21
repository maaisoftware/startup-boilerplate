import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetClientEnvCacheForTests,
  getClientEnv,
  validateClientEnv,
} from "./client.ts";

const validSource = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "Startup Boilerplate",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421",
};

describe("validateClientEnv", () => {
  beforeEach(() => {
    __resetClientEnvCacheForTests();
  });

  it("returns a frozen object on success", () => {
    const env = validateClientEnv(validSource);
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("Startup Boilerplate");
    expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe("https://us.i.posthog.com");
    expect(Object.isFrozen(env)).toBe(true);
  });

  it("throws with a formatted error when APP_URL is malformed", () => {
    expect(() =>
      validateClientEnv({ ...validSource, NEXT_PUBLIC_APP_URL: "local" }),
    ).toThrow(/Refusing to start/);
  });
});

describe("getClientEnv", () => {
  beforeEach(() => {
    __resetClientEnvCacheForTests();
  });

  it("caches after the first call", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, ...validSource };
    try {
      const first = getClientEnv();
      const second = getClientEnv();
      expect(first).toBe(second);
    } finally {
      process.env = originalEnv;
    }
  });
});
