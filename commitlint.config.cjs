/**
 * Conventional commits enforcement.
 * Scopes match the packages/ and apps/ directory names so the history
 * reads like a map of the monorepo.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "test",
        "chore",
        "refactor",
        "perf",
        "ci",
        "build",
        "style",
        "revert",
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        // packages
        "config",
        "env",
        "types",
        "logger",
        "analytics",
        "feature-flags",
        "db",
        "auth",
        "api-client",
        "cms",
        "payments",
        "automations",
        "docs-engine",
        "ui",
        // apps
        "web",
        // cross-cutting
        "monorepo",
        "docker",
        "ci",
        "deps",
        "knowledge",
        "supabase",
        "release",
      ],
    ],
    // Allow lower-case and sentence-case subjects — acronyms (API, JWT,
    // VSCode, etc.) can't live inside a strict lower-case rule.
    "subject-case": [2, "never", ["upper-case", "start-case", "pascal-case"]],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [1, "always", 100],
  },
};
