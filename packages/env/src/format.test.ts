import { describe, expect, it } from "vitest";
import { z } from "zod";

import { formatEnvError } from "./format.ts";

describe("formatEnvError", () => {
  it("produces a multi-line report with each invalid field on its own line", () => {
    const schema = z.object({
      AUTH_SECRET: z.string().min(32),
      NEXT_PUBLIC_APP_URL: z.url(),
    });
    const result = schema.safeParse({
      AUTH_SECRET: "short",
      NEXT_PUBLIC_APP_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = formatEnvError(result.error);
      expect(message).toMatch(/Refusing to start/);
      expect(message).toMatch(/AUTH_SECRET/);
      expect(message).toMatch(/NEXT_PUBLIC_APP_URL/);
      expect(message).toMatch(/\.env\.example/);
    }
  });

  it("labels top-level issues as '(root)' when path is empty", () => {
    const schema = z.object({ foo: z.string() });
    const result = schema.safeParse("not an object");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatEnvError(result.error)).toMatch(/\(root\)/);
    }
  });
});
