import { db } from './db';
import { auditLogs } from './db/schema';

export async function audit(staffId: number | null, action: string, entity: string, entityId?: string | number, detail?: Record<string, unknown>) {
  await db.insert(auditLogs).values({ staffId, action, entity, entityId: entityId != null ? String(entityId) : null, detail: detail ?? null });
}
