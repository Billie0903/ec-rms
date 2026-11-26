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

export async function list({ role, q }) {
  const where = [];
  const params = [];
  if (role) { where.push('role = ?'); params.push(role); }
  if (q) { where.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS},
            (SELECT COUNT(*) FROM resident_relatives rr WHERE rr.relative_user_id = users.id AND rr.active = 1) AS linkedResidents
       FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY FIELD(role, 'admin', 'operator', 'relative'), full_name`,
    params,
  );
  return rows;
}

export async function create({ fullName, email, phone, role }, db = pool) {
  const [r] = await db.query("INSERT INTO users (full_name, email, phone, role, status) VALUES (?, ?, ?, ?, 'invited')",
    [fullName, email, phone ?? null, role]);
  return r.insertId;
}

export async function update(id, fields, db = pool) {
  const map = { fullName: 'full_name', phone: 'phone', role: 'role', status: 'status' };
  const keys = Object.keys(map).filter((k) => fields[k] !== undefined);
  if (!keys.length) return;
  await db.query(`UPDATE users SET ${keys.map((k) => `${map[k]} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => fields[k]), id]);
}

export async function countActiveAdmins(db = pool) {
  const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active'");
  return n;
}
