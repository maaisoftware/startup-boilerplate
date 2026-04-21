import react from "@startup-boilerplate/config/vitest/react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  react,
  defineConfig({
    test: {
      passWithNoTests: true,
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  }),
);
