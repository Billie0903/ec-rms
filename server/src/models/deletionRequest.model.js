import { pool } from '../config/db.js';

const SELECT = `
  SELECT d.id, d.resident_id AS residentId, r.full_name AS residentName, r.resident_code AS residentCode,
         r.status AS residentStatus, d.reason, d.status, d.review_note AS reviewNote,
         d.requested_by AS requestedById, rq.full_name AS requestedByName,
         d.reviewed_by AS reviewedById, rv.full_name AS reviewedByName,
         d.created_at AS createdAt, d.reviewed_at AS reviewedAt
    FROM deletion_requests d
    JOIN residents r ON r.id = d.resident_id
    JOIN users rq ON rq.id = d.requested_by
    LEFT JOIN users rv ON rv.id = d.reviewed_by`;

export async function list({ status }) {
  const params = [];
  let where = '';
  if (status !== 'all') { where = 'WHERE d.status = ?'; params.push(status); }
  const [rows] = await pool.query(`${SELECT} ${where} ORDER BY d.created_at DESC`, params);
  return rows;
}

export async function findById(id, db = pool, { forUpdate = false } = {}) {
  const [rows] = await db.query(`${SELECT} WHERE d.id = ? ${forUpdate ? 'FOR UPDATE' : ''}`, [id]);
  return rows[0] || null;
}

export async function findPendingForResident(residentId, db = pool) {
  const [rows] = await db.query(`${SELECT} WHERE d.resident_id = ? AND d.status = 'pending'`, [residentId]);
  return rows[0] || null;
}

export async function create({ residentId, requestedBy, reason }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO deletion_requests (resident_id, requested_by, reason) VALUES (?, ?, ?)',
    [residentId, requestedBy, reason],
  );
  return result.insertId;
}

export async function review(id, { status, reviewedBy, note }, db = pool) {
  await db.query(
    'UPDATE deletion_requests SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = NOW() WHERE id = ?',
    [status, reviewedBy, note ?? null, id],
  );
}

/** Close any pending request when the Admin archives directly or the resident is restored. */
export async function cancelPendingForResident(residentId, db = pool) {
  await db.query("UPDATE deletion_requests SET status = 'cancelled' WHERE resident_id = ? AND status = 'pending'", [residentId]);
}
