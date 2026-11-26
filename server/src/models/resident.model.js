import crypto from 'node:crypto';
import { pool } from '../config/db.js';

const SELECT = `
  SELECT r.id, r.resident_code AS residentCode, r.full_name AS fullName, r.date_of_birth AS dateOfBirth,
         TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age, r.gender, r.photo_url AS photoUrl, r.room,
         r.admission_date AS admissionDate, r.status, r.mobility_level AS mobilityLevel, r.fall_risk AS fallRisk,
         r.diet_notes AS dietNotes, r.cognitive_status AS cognitiveStatus, r.primary_doctor AS primaryDoctor,
         r.preferred_hospital AS preferredHospital, r.archived_at AS archivedAt,
         r.created_at AS createdAt, r.updated_at AS updatedAt
    FROM residents r`;

// Whitelisted ORDER BY columns: never put user input straight into SQL.
const SORT_COLUMNS = {
  name: 'r.full_name',
  room: 'r.room',
  admissionDate: 'r.admission_date',
  age: 'r.date_of_birth', // older first = earlier date, so flipped below
};

const COLUMN_MAP = {
  fullName: 'full_name', dateOfBirth: 'date_of_birth', gender: 'gender', photoUrl: 'photo_url', room: 'room',
  admissionDate: 'admission_date', status: 'status', mobilityLevel: 'mobility_level', fallRisk: 'fall_risk',
  dietNotes: 'diet_notes', cognitiveStatus: 'cognitive_status', primaryDoctor: 'primary_doctor',
  preferredHospital: 'preferred_hospital',
};

export async function list({ q, status, fallRisk, sort, order, page, pageSize }) {
  const where = [];
  const params = [];

  if (q) {
    where.push('(r.full_name LIKE ? OR r.resident_code LIKE ? OR r.room LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (!status) where.push("r.status <> 'archived'"); // default: hide archived
  else if (status !== 'all') { where.push('r.status = ?'); params.push(status); }
  if (fallRisk) { where.push('r.fall_risk = ?'); params.push(fallRisk); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  let direction = order === 'desc' ? 'DESC' : 'ASC';
  if (sort === 'age') direction = direction === 'ASC' ? 'DESC' : 'ASC';
  const orderSql = `ORDER BY ${SORT_COLUMNS[sort]} IS NULL, ${SORT_COLUMNS[sort]} ${direction}, r.id ASC`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM residents r ${whereSql}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  return { rows, total };
}

export async function findById(id, db = pool) {
  const [rows] = await db.query(`${SELECT} WHERE r.id = ?`, [id]);
  return rows[0] || null;
}

export async function create(data, createdBy, db = pool) {
  const cols = Object.keys(COLUMN_MAP).filter((k) => data[k] !== undefined);
  // Temporary unique code, replaced with RS-0001 style once we know the id.
  const tempCode = `T${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`; // fits VARCHAR(20)
  const [result] = await db.query(
    `INSERT INTO residents (resident_code, created_by, ${cols.map((k) => COLUMN_MAP[k]).join(', ')})
     VALUES (?, ?, ${cols.map(() => '?').join(', ')})`,
    [tempCode, createdBy, ...cols.map((k) => data[k])],
  );
  const id = result.insertId;
  await db.query('UPDATE residents SET resident_code = ? WHERE id = ?', [`RS-${String(id).padStart(4, '0')}`, id]);
  return id;
}

export async function update(id, data, db = pool) {
  const cols = Object.keys(COLUMN_MAP).filter((k) => data[k] !== undefined);
  if (!cols.length) return;
  await db.query(
    `UPDATE residents SET ${cols.map((k) => `${COLUMN_MAP[k]} = ?`).join(', ')} WHERE id = ?`,
    [...cols.map((k) => data[k]), id],
  );
}

export async function setArchived(id, archived, db = pool) {
  if (archived) {
    await db.query("UPDATE residents SET status = 'archived', archived_at = NOW() WHERE id = ?", [id]);
  } else {
    await db.query("UPDATE residents SET status = 'active', archived_at = NULL WHERE id = ?", [id]);
  }
}
