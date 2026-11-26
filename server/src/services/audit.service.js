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

export async function list({ action, entityType, actorId, from, to, page, pageSize }) {
  const where = [];
  const params = [];
  if (action) { where.push('a.action LIKE ?'); params.push(`${action}%`); }
  if (entityType) { where.push('a.entity_type = ?'); params.push(entityType); }
  if (actorId) { where.push('a.actor_user_id = ?'); params.push(actorId); }
  if (from) { where.push('a.created_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('a.created_at <= ?'); params.push(`${to} 23:59:59`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs a ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.entity_type AS entityType, a.entity_id AS entityId, a.before_data AS beforeData, a.after_data AS afterData,
            a.ip_address AS ipAddress, a.created_at AS createdAt, a.actor_user_id AS actorId, u.full_name AS actorName, u.role AS actorRole
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
       ${whereSql} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]);
  return { rows, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}
