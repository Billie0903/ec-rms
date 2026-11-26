import { pool } from '../config/db.js';

const PUBLIC_COLUMNS = 'id, full_name, email, phone, role, status, last_login_at, created_at, updated_at';

export async function findById(id, db = pool) {
  const [rows] = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

/** Includes password_hash: only for login. */
export async function findByEmailWithHash(email, db = pool) {
  const [rows] = await db.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ?`, [email]);
  return rows[0] || null;
}

export async function setPasswordAndActivate(id, passwordHash, db = pool) {
  await db.query(`UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?`, [passwordHash, id]);
}

export async function touchLastLogin(id, db = pool) {
  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}
