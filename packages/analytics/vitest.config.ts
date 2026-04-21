import node from "@startup-boilerplate/config/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  node,
  defineConfig({
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        include: ["src/**/*.ts"],
        exclude: [
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/**/*.d.ts",
          "src/contract.ts",
        ],
        thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
      },
    },
  }),
);
