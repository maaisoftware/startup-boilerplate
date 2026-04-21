import node from "@startup-boilerplate/config/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  node,
  defineConfig({
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        include: ["src/**/*.ts"],
        exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.d.ts"],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 95,
          statements: 100,
        },
      },
    },
  }),
);
