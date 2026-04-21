import { getServerEnv } from "@startup-boilerplate/env/server";

import { NoopAutomations } from "./adapters/noop.ts";
import { N8nAutomations } from "./adapters/n8n.ts";
import type { Automations } from "./interfaces.ts";

let cached: Automations | undefined;

export function getAutomations(): Automations {
  if (cached) return cached;
  const env = getServerEnv();
  if (
    env.AUTOMATIONS_PROVIDER === "n8n" &&
    env.N8N_WEBHOOK_URL &&
    env.N8N_WEBHOOK_SECRET
  ) {
    cached = new N8nAutomations({
      webhookUrl: env.N8N_WEBHOOK_URL,
      webhookSecret: env.N8N_WEBHOOK_SECRET,
    });
    return cached;
  }
  cached = new NoopAutomations();
  return cached;
}

export function __resetAutomationsCacheForTests(): void {
  cached = undefined;
}
