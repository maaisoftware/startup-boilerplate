import node from "@startup-boilerplate/config/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  node,
  defineConfig({
    test: {
      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "test/**/*.{test,spec}.{ts,tsx}",
      ],
      testTimeout: 20_000,
      coverage: {
        include: ["src/**/*.ts"],
        exclude: [
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/**/*.d.ts",
          "src/contract.ts",
        ],
      },
    },
  }),
);
