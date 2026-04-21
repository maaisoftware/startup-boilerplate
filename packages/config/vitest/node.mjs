// @ts-check
import base from "./base.mjs";
import { mergeConfig, defineConfig } from "vitest/config";

/** Vitest preset for Node/library packages. */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
);
