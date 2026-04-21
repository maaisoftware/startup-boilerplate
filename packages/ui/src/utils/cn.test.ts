import { describe, expect, it } from "vitest";

import { cn } from "./cn.ts";

describe("cn", () => {
  it("merges conditional classes", () => {
    const show = false;
    expect(cn("a", show && "b", "c")).toBe("a c");
  });
  it("deduplicates conflicting tailwind classes via tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-green-500")).toBe("text-green-500");
  });
});
