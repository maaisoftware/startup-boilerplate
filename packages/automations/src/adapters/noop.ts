import type {
  Automations,
  AutomationTriggerInput,
  AutomationTriggerResult,
} from "../interfaces.ts";

export class NoopAutomations implements Automations {
  isEnabled(): boolean {
    return false;
  }
  trigger(_input: AutomationTriggerInput): Promise<AutomationTriggerResult> {
    return Promise.resolve({ executionId: null });
  }
}
