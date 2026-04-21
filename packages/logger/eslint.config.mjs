import base from "@startup-boilerplate/config/eslint/node-library";

export default [
  ...base,
  {
    // Adapter files intentionally call `console.*` — that's the adapter's
    // only job. The rest of the package treats console as forbidden.
    files: ["src/adapters/console.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Tests and the shared contract suite spy on console directly when
    // verifying adapter behaviour.
    files: ["src/**/*.test.ts", "src/contract.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
