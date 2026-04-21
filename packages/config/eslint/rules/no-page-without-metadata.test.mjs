// @ts-check
import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, it } from "vitest";

import rule from "./no-page-without-metadata.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

describe("no-page-without-metadata", () => {
  it("accepts page.tsx that exports const metadata", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/app/blog/page.tsx",
          code: `
            export const metadata = { title: "Blog" };
            export default function Page() { return null; }
          `,
        },
      ],
      invalid: [],
    });
  });

  it("accepts page.tsx that exports generateMetadata function", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/app/blog/[slug]/page.tsx",
          code: `
            export async function generateMetadata() { return { title: "X" }; }
            export default function Page() { return null; }
          `,
        },
      ],
      invalid: [],
    });
  });

  it("accepts re-export form export { metadata }", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/app/about/page.tsx",
          code: `
            const metadata = { title: "About" };
            export { metadata };
            export default function Page() { return null; }
          `,
        },
      ],
      invalid: [],
    });
  });

  it("rejects page.tsx with no metadata export", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [],
      invalid: [
        {
          filename: "apps/web/src/app/pricing/page.tsx",
          code: `
            export default function Page() { return null; }
          `,
          errors: [{ messageId: "missingMetadata" }],
        },
      ],
    });
  });

  it("ignores layout.tsx", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/app/layout.tsx",
          code: `
            export default function Layout({ children }) { return children; }
          `,
        },
      ],
      invalid: [],
    });
  });

  it("ignores not-found.tsx, error.tsx, loading.tsx", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/app/not-found.tsx",
          code: `export default function NotFound() { return null; }`,
        },
        {
          filename: "apps/web/src/app/blog/[slug]/error.tsx",
          code: `export default function Error() { return null; }`,
        },
        {
          filename: "apps/web/src/app/blog/loading.tsx",
          code: `export default function Loading() { return null; }`,
        },
      ],
      invalid: [],
    });
  });

  it("ignores files outside app/", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [
        {
          filename: "apps/web/src/lib/page.tsx",
          code: `export const something = 1;`,
        },
        {
          filename: "packages/ui/src/primitives/page.tsx",
          code: `export const x = 1;`,
        },
      ],
      invalid: [],
    });
  });

  it("handles Windows backslash paths", () => {
    ruleTester.run("no-page-without-metadata", rule, {
      valid: [],
      invalid: [
        {
          filename: "apps\\web\\src\\app\\blog\\page.tsx",
          code: `export default function Page() { return null; }`,
          errors: [{ messageId: "missingMetadata" }],
        },
      ],
    });
  });
});
