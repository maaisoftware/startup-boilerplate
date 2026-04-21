import type { z } from "zod";

/**
 * Formats a Zod validation error into a human-readable multi-line string
 * suitable for crashing a boot process loudly. Each invalid field gets its
 * own line with path + message.
 */
export function formatEnvError(error: z.ZodError): string {
  const lines: string[] = [
    "❌ Invalid environment variables. Refusing to start.",
    "",
  ];

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "(root)";
    lines.push(`  • ${path}: ${issue.message}`);
  }

  lines.push("");
  lines.push("See .env.example for the full list of required variables.");
  return lines.join("\n");
}
