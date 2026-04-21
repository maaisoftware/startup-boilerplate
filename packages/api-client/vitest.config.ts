import node from "@startup-boilerplate/config/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  node,
  defineConfig({
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
        thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  }),
);
