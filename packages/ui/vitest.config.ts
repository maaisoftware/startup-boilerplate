import react from "@startup-boilerplate/config/vitest/react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  react,
  defineConfig({
    test: {
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      },
    },
  }),
);
