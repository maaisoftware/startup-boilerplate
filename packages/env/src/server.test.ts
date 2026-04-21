import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetServerEnvCacheForTests,
  getServerEnv,
  validateServerEnv,
} from "./server.ts";

const validSource = {
  NODE_ENV: "test",
  AUTH_SECRET: "a".repeat(40),
  CSRF_SECRET: "b".repeat(40),
  SUPABASE_DB_URL: "postgresql://postgres:postgres@127.0.0.1:54422/postgres",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: "Test",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54421",
};

describe("validateServerEnv", () => {
  beforeEach(() => {
    __resetServerEnvCacheForTests();
  });

  it("returns a frozen object on success", () => {
    const env = validateServerEnv(validSource);
    expect(env.AUTH_SECRET).toBe("a".repeat(40));
    expect(Object.isFrozen(env)).toBe(true);
  });

  it("throws a formatted error on failure", () => {
    expect(() =>
      validateServerEnv({ ...validSource, AUTH_SECRET: "tiny" }),
    ).toThrow(/Refusing to start.*AUTH_SECRET/s);
  });

  it("throws when required keys are missing", () => {
    // Intentional test of missing required field — empty source
    // should fail on AUTH_SECRET + CSRF_SECRET + SUPABASE_DB_URL.
    expect(() => validateServerEnv({})).toThrow(/AUTH_SECRET.*CSRF_SECRET/s);
  });
});

describe("getServerEnv", () => {
  beforeEach(() => {
    __resetServerEnvCacheForTests();
  });

  it("caches after the first call", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, ...validSource };
    try {
      const first = getServerEnv();
      const second = getServerEnv();
      expect(first).toBe(second);
    } finally {
      process.env = originalEnv;
    }
  });

  it("validates process.env on first read", () => {
    const originalEnv = process.env;
    process.env = {};
    try {
      expect(() => getServerEnv()).toThrow(/Refusing to start/);
    } finally {
      process.env = originalEnv;
    }
  });
});
