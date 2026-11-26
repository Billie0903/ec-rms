import { pool } from '../config/db.js';

const SELECT = `
  SELECT rr.id, rr.resident_id AS residentId, rr.relative_user_id AS relativeUserId,
         u.full_name AS fullName, u.email, u.phone, u.status AS accountStatus,
         rr.relationship, rr.access_level AS accessLevel,
         rr.is_emergency_contact AS isEmergencyContact, rr.is_legal_guardian AS isLegalGuardian,
         rr.consent_recorded_at AS consentRecordedAt, cb.full_name AS consentRecordedByName, rr.consent_note AS consentNote,
         rr.active, rr.created_at AS createdAt
    FROM resident_relatives rr
    JOIN users u ON u.id = rr.relative_user_id
    LEFT JOIN users cb ON cb.id = rr.consent_recorded_by`;

const bools = (r) => r && ({ ...r, isEmergencyContact: Boolean(r.isEmergencyContact), isLegalGuardian: Boolean(r.isLegalGuardian), active: Boolean(r.active) });

export async function listForResident(residentId) {
  const [rows] = await pool.query(`${SELECT} WHERE rr.resident_id = ? ORDER BY rr.active DESC, rr.is_legal_guardian DESC, u.full_name`, [residentId]);
  return rows.map(bools);
}

export async function findById(id, db = pool) {
  const [rows] = await db.query(`${SELECT} WHERE rr.id = ?`, [id]);
  return bools(rows[0]) || null;
}

export async function findByPair(residentId, userId, db = pool) {
  const [rows] = await db.query(`${SELECT} WHERE rr.resident_id = ? AND rr.relative_user_id = ?`, [residentId, userId]);
  return bools(rows[0]) || null;
}

export async function create(residentId, userId, d, recordedBy, db = pool) {
  const [r] = await db.query(
    `INSERT INTO resident_relatives (resident_id, relative_user_id, relationship, access_level, is_emergency_contact, is_legal_guardian,
                                     consent_recorded_at, consent_recorded_by, consent_note)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [residentId, userId, d.relationship, d.accessLevel, d.isEmergencyContact, d.isLegalGuardian, recordedBy, d.consentNote ?? null]);
  return r.insertId;
}

/** Re-link a previously unlinked relative with fresh consent. */
export async function reactivate(id, d, recordedBy, db = pool) {
  await db.query(
    `UPDATE resident_relatives SET active = 1, relationship = ?, access_level = ?, is_emergency_contact = ?, is_legal_guardian = ?,
            consent_recorded_at = NOW(), consent_recorded_by = ?, consent_note = ? WHERE id = ?`,
    [d.relationship, d.accessLevel, d.isEmergencyContact, d.isLegalGuardian, recordedBy, d.consentNote ?? null, id]);
}

export async function update(id, d, db = pool) {
  const map = { relationship: 'relationship', accessLevel: 'access_level', isEmergencyContact: 'is_emergency_contact', isLegalGuardian: 'is_legal_guardian', active: 'active' };
  const keys = Object.keys(map).filter((k) => d[k] !== undefined);
  if (!keys.length) return;
  await db.query(`UPDATE resident_relatives SET ${keys.map((k) => `${map[k]} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => d[k]), id]);
}

// ---------- Family (relative) access: always filtered by an active link ----------

export async function listLinkedResidents(userId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.full_name AS fullName, r.photo_url AS photoUrl, r.room, r.status,
            TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age, rr.relationship, rr.access_level AS accessLevel
       FROM resident_relatives rr JOIN residents r ON r.id = rr.resident_id
      WHERE rr.relative_user_id = ? AND rr.active = 1 AND r.status <> 'archived'
      ORDER BY r.full_name`,
    [userId]);
  return rows;
}

export async function findActiveLink(residentId, userId) {
  const [rows] = await pool.query(
    `SELECT rr.access_level AS accessLevel, rr.relationship
       FROM resident_relatives rr JOIN residents r ON r.id = rr.resident_id
      WHERE rr.resident_id = ? AND rr.relative_user_id = ? AND rr.active = 1 AND r.status <> 'archived'`,
    [residentId, userId]);
  return rows[0] || null;
}
