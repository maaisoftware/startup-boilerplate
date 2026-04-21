import node from "@startup-boilerplate/config/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";
export default mergeConfig(
  node,
  defineConfig({ test: { include: ["src/**/*.{test,spec}.{ts,tsx}"] } }),
);
