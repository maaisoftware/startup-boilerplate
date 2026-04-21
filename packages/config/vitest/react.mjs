// @ts-check
import base from "./base.mjs";
import { mergeConfig, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Vitest preset for React/DOM-targeted packages. */
export default mergeConfig(
  base,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
    },
  }),
);
