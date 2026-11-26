import { pool } from '../config/db.js';

/**
 * Append an audit entry. Keep health details out of `action`; put changed
 * fields in before/after only for record edits.
 */
export async function record({ actorId, action, entityType, entityId = null, before = null, after = null, ip = null }, db = pool) {
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [actorId, action, entityType, entityId, before && JSON.stringify(before), after && JSON.stringify(after), ip],
  );
}
