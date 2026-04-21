// @ts-check
import { defineConfig } from "vitest/config";

/**
 * Base Vitest preset. Consumers spread this and add test-env-specific options.
 * Coverage thresholds apply to reusable packages — keep them high.
 */
export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/coverage/**",
        "**/*.config.*",
        "**/*.d.ts",
        "**/generated/**",
        "**/test/fixtures/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
