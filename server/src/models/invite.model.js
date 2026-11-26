import { pool } from '../config/db.js';

export async function findValidByTokenHash(tokenHash, db = pool) {
  const [rows] = await db.query(
    `SELECT i.id, i.user_id, i.expires_at, i.used_at,
            u.full_name, u.email, u.role, u.status AS user_status
       FROM account_invites i
       JOIN users u ON u.id = i.user_id
      WHERE i.token_hash = ?`,
    [tokenHash],
  );
  return rows[0] || null;
}

export async function markUsed(id, db = pool) {
  await db.query('UPDATE account_invites SET used_at = NOW() WHERE id = ?', [id]);
}

export async function create({ userId, tokenHash, expiresAt, createdBy }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO account_invites (user_id, token_hash, expires_at, created_by) VALUES (?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, createdBy],
  );
  return result.insertId;
}
