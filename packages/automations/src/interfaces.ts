export interface AutomationTriggerInput {
  /** Slug identifying the workflow — mapped by the adapter to a real URL/ID. */
  workflow: string;
  /** Arbitrary payload forwarded to the workflow engine. */
  payload: Record<string, unknown>;
}

export interface AutomationTriggerResult {
  /** Provider-specific execution id; null for noop or disabled adapters. */
  executionId: string | null;
}

export interface Automations {
  isEnabled(): boolean;
  trigger(input: AutomationTriggerInput): Promise<AutomationTriggerResult>;
}
