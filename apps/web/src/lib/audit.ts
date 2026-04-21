import { getDb, auditLog } from "@startup-boilerplate/db";
import { getLogger } from "@startup-boilerplate/logger";

/**
 * Audit-log writer.
 *
 * Every mutation that flows through /api/* should call writeAudit() before
 * returning. The DB trigger enforces immutability — even service_role
 * cannot UPDATE or DELETE these rows. Never rely on the audit log for
 * transactional correctness; it's a record, not a lock.
 *
 * Failures are swallowed and logged via the logger abstraction — a
 * broken audit sink must not block the user's request.
 */

export interface AuditRecord {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAudit(record: AuditRecord): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLog).values({
      userId: record.userId ?? null,
      action: record.action,
      resourceType: record.resourceType,
      resourceId: record.resourceId ?? null,
      metadata: record.metadata ?? null,
      ipAddress: record.ipAddress ?? null,
      userAgent: record.userAgent ?? null,
    });
  } catch (error) {
    const log = await getLogger();
    log.error(error instanceof Error ? error : new Error(String(error)), {
      scope: "audit.write_failed",
      action: record.action,
      resourceType: record.resourceType,
    });
  }
}
