import { NextResponse } from "next/server";

import { getClientEnv } from "@startup-boilerplate/env/client";

/**
 * /llms.txt — an Anthropic/OpenAI-friendly signal that lists the
 * "good paths" for LLM-based crawlers. Keeps it minimal; agencies
 * customise per-client.
 */
export function GET(): NextResponse {
  const env = getClientEnv();
  const origin = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const body = `# ${env.NEXT_PUBLIC_APP_NAME}

> Production-grade boilerplate for rapidly bootstrapping new client projects.

## Primary paths
- ${origin}/
- ${origin}/blog
- ${origin}/sitemap.xml

## Policy
- Allowed: public posts and pages. Respect robots.txt.
- Disallowed: /api/*, /admin/*.
`;
  return new NextResponse(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
