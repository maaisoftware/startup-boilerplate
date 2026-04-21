import next from "@startup-boilerplate/config/eslint/next";

export default [
  ...next,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
