import { describe, expect, it } from "vitest";

import { isLogLevel, levelPriority, shouldEmit } from "./levels.ts";

describe("levels", () => {
  it("priorities are monotonically increasing debug < info < warn < error < silent", () => {
    expect(levelPriority.debug).toBeLessThan(levelPriority.info);
    expect(levelPriority.info).toBeLessThan(levelPriority.warn);
    expect(levelPriority.warn).toBeLessThan(levelPriority.error);
    expect(levelPriority.error).toBeLessThan(levelPriority.silent);
  });

  it("shouldEmit returns true when record level >= threshold", () => {
    expect(shouldEmit("error", "info")).toBe(true);
    expect(shouldEmit("info", "info")).toBe(true);
    expect(shouldEmit("debug", "info")).toBe(false);
  });

  it("silent threshold blocks everything except silent itself", () => {
    expect(shouldEmit("error", "silent")).toBe(false);
    expect(shouldEmit("warn", "silent")).toBe(false);
    expect(shouldEmit("debug", "silent")).toBe(false);
  });

  it("isLogLevel accepts valid strings and rejects others", () => {
    expect(isLogLevel("info")).toBe(true);
    expect(isLogLevel("error")).toBe(true);
    expect(isLogLevel("nope")).toBe(false);
    expect(isLogLevel(5)).toBe(false);
    expect(isLogLevel(undefined)).toBe(false);
  });
});
