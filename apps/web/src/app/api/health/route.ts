import { NextResponse } from "next/server";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getServerEnv } from "@startup-boilerplate/env/server";

/**
 * Liveness probe.
 *
 * Returns 200 if the app is up. Does NOT verify downstream services
 * (DB, Supabase, etc.) — that's the readiness probe introduced in PR #6.
 *
 * Reading the env via the typed singletons guarantees the response shape
 * stays honest even if a deploy is missing required variables (we crash
 * at boot before this handler would ever run).
 */
export function GET(): NextResponse {
  const clientEnv = getClientEnv();
  const serverEnv = getServerEnv();
  return NextResponse.json(
    {
      status: "ok",
      name: clientEnv.NEXT_PUBLIC_APP_NAME,
      environment: serverEnv.NODE_ENV,
      version: process.env["npm_package_version"] ?? "0.0.0",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
