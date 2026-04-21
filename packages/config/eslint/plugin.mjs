// @ts-check
import noPageWithoutMetadata from "./rules/no-page-without-metadata.mjs";

/**
 * Project-local ESLint plugin. Hosts custom rules that enforce
 * invariants unique to this template. Currently one rule;
 * add more here as they come online.
 *
 * Registered in `./next.mjs` under the name `startup-boilerplate`.
 *
 * @type {import('eslint').ESLint.Plugin}
 */
const plugin = {
  meta: {
    name: "startup-boilerplate",
    version: "0.1.0",
  },
  rules: {
    "no-page-without-metadata": noPageWithoutMetadata,
  },
};

export default plugin;
