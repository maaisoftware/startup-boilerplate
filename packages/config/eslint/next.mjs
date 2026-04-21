// @ts-check
import base from "./base.mjs";
import localPlugin from "./plugin.mjs";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/**
 * ESLint preset for the Next.js app.
 * Enforces Next.js rules, React hooks, and the SEO metadata requirement
 * via the custom `startup-boilerplate/no-page-without-metadata` rule.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  ...base,
  {
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "startup-boilerplate": localPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "startup-boilerplate/no-page-without-metadata": "error",
    },
  },
];
