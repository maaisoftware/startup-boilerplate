// @ts-check
/**
 * @fileoverview ESLint rule — Next.js `page.tsx` files inside an `app/`
 * directory must export `metadata` or `generateMetadata`. This enforces
 * the non-negotiable SEO rule documented in the root CLAUDE.md and
 * complements `<PageShell>`'s TypeScript-level prop enforcement.
 *
 * Detection:
 *   - File ends with `/app/…/page.{tsx,ts,jsx,js}` (any depth under `app`).
 *   - Checks `ExportNamedDeclaration` nodes for a variable or function
 *     named `metadata` or `generateMetadata`.
 *   - Also accepts `export { metadata }` and `export { generateMetadata }`
 *     re-export forms.
 *
 * Intentionally does NOT trigger on:
 *   - `layout.{tsx,ts}` — Next.js doesn't require metadata on layouts.
 *   - `not-found.tsx`, `error.tsx`, `loading.tsx` — these are rendered
 *     inside a parent page's metadata context.
 *   - Files outside any `app/` directory.
 */

const PAGE_FILE_REGEX = /\/app\/(?:[^/]+\/)*page\.(?:tsx|ts|jsx|js)$/;

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require Next.js page.tsx files under app/ to export `metadata` or `generateMetadata`.",
      recommended: true,
    },
    messages: {
      missingMetadata:
        "Next.js page at {{path}} must export `metadata` or `generateMetadata`. See knowledge/architecture/overview.md (SEO rails) and CLAUDE.md non-negotiable #4.",
    },
    schema: [],
  },

  create(context) {
    const filename = (context.filename ?? context.getFilename()).replace(/\\/g, "/");
    if (!PAGE_FILE_REGEX.test(filename)) {
      return {};
    }

    let hasMetadata = false;

    const markIfMatches = (name) => {
      if (name === "metadata" || name === "generateMetadata") {
        hasMetadata = true;
      }
    };

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (decl && decl.type === "VariableDeclaration") {
          for (const d of decl.declarations) {
            if (d.id && d.id.type === "Identifier") {
              markIfMatches(d.id.name);
            }
          }
        } else if (
          decl &&
          (decl.type === "FunctionDeclaration" ||
            decl.type === "TSDeclareFunction" ||
            decl.type === "TSFunctionType")
        ) {
          if (decl.id && decl.id.type === "Identifier") {
            markIfMatches(decl.id.name);
          }
        }
        if (node.specifiers && node.specifiers.length > 0) {
          for (const s of node.specifiers) {
            const exported = s.exported;
            if (exported && exported.type === "Identifier") {
              markIfMatches(exported.name);
            }
          }
        }
      },
      "Program:exit"(node) {
        if (!hasMetadata) {
          context.report({
            node,
            messageId: "missingMetadata",
            data: { path: filename.split("/").slice(-3).join("/") },
          });
        }
      },
    };
  },
};

export default rule;
