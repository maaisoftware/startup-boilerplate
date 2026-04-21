import type {
  Automations,
  AutomationTriggerInput,
  AutomationTriggerResult,
} from "../interfaces.ts";

/**
 * n8n adapter: POSTs to a configured webhook URL. Authenticates via a
 * shared HMAC secret the n8n workflow verifies on entry.
 *
 * The adapter is tolerant of failures — it returns `{executionId: null}`
 * rather than throwing so a down automation service never breaks the
 * user's request.
 */

export interface N8nAutomationsOptions {
  webhookUrl: string;
  webhookSecret: string;
  /** Injected fetch for tests. Defaults to global fetch. */
  fetcher?: typeof fetch;
}

export class N8nAutomations implements Automations {
  private readonly url: string;
  private readonly secret: string;
  private readonly fetcher: typeof fetch;

  constructor(options: N8nAutomationsOptions) {
    this.url = options.webhookUrl;
    this.secret = options.webhookSecret;
    this.fetcher = options.fetcher ?? fetch;
  }

  isEnabled(): boolean {
    return true;
  }

  async trigger(
    input: AutomationTriggerInput,
  ): Promise<AutomationTriggerResult> {
    try {
      const response = await this.fetcher(this.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": this.secret,
          "x-workflow": input.workflow,
        },
        body: JSON.stringify(input.payload),
      });
      if (!response.ok) return { executionId: null };
      const body = (await response.json().catch(() => undefined)) as
        | { executionId?: string }
        | undefined;
      return { executionId: body?.executionId ?? null };
    } catch {
      return { executionId: null };
    }
  }
}
