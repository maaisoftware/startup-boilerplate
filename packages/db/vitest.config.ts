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
      // Integration tests against a real local Supabase instance need more
      // time than pure unit tests.
      testTimeout: 30_000,
      hookTimeout: 30_000,
      coverage: {
        include: ["src/**/*.ts"],
        exclude: [
          "src/**/*.test.ts",
          "src/**/*.spec.ts",
          "src/**/*.d.ts",
          "src/generated/**",
          "src/seed.ts",
        ],
      },
    },
  }),
);
