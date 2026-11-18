import { db } from './db';
import { auditLogs } from './db/schema';
import { ipHash } from './security';

/** Append-only audit trail (the database refuses updates and deletes on audit_logs). */
export async function audit(staffId: number | null, action: string, entity: string, entityId?: string | number, detail?: Record<string, unknown>) {
  const ip = await ipHash().catch(() => null); // no request context in scripts / cron
  await db.insert(auditLogs).values({ staffId, action, entity, entityId: entityId != null ? String(entityId) : null, detail: detail ?? null, ipHash: ip });
}
