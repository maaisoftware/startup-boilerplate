import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

/**
 * Docusaurus configuration for the external-facing documentation site.
 *
 * Runs on port 3100 in dev (leaving 3000 for apps/web). Builds into
 * `build/` and can be served statically from anywhere — the default
 * deploy target is a Vercel project under a `docs.` subdomain.
 */

const config: Config = {
  title: "Startup Boilerplate",
  tagline: "Production-grade, AI-ready monorepo template",
  favicon: "img/logo.svg",

  url: process.env.DOCS_SITE_URL ?? "https://docs.example.com",
  baseUrl: "/",

  organizationName: "maaisoftware",
  projectName: "startup-boilerplate",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/maaisoftware/startup-boilerplate/tree/main/apps/docs/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          editUrl:
            "https://github.com/maaisoftware/startup-boilerplate/tree/main/apps/docs/",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: "Startup Boilerplate",
      logo: {
        alt: "Startup Boilerplate Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/maaisoftware/startup-boilerplate",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [{ label: "Getting started", to: "/docs/intro" }],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Discussions",
              href: "https://github.com/maaisoftware/startup-boilerplate/discussions",
            },
          ],
        },
        {
          title: "More",
          items: [
            { label: "Blog", to: "/blog" },
            {
              label: "GitHub",
              href: "https://github.com/maaisoftware/startup-boilerplate",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Startup Boilerplate. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "diff", "json", "hcl", "toml"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
