import { NextResponse } from "next/server";

import { getClientEnv } from "@startup-boilerplate/env/client";
import { getServerEnv } from "@startup-boilerplate/env/server";

/**
 * Liveness probe.
 *
 * Returns 200 if the app is up. Does NOT verify downstream services
 * (DB, Supabase, etc.) — that's the readiness probe added alongside
 * real load paths.
 *
 * Intentionally does not use the apiHandler wrapper — this route is the
 * first to respond before any bootstrapping has completed, so any guard
 * dependency would become a liveness false-negative.
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
      headers: { "Cache-Control": "no-store" },
    },
  );
}
