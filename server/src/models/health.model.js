import { pool } from '../config/db.js';

/** Allergies and health conditions: small child tables of residents. */

export async function listAllergies(residentId) {
  const [rows] = await pool.query(
    `SELECT id, resident_id AS residentId, allergen, type, reaction, severity, created_at AS createdAt
       FROM allergies WHERE resident_id = ? ORDER BY FIELD(severity, 'severe', 'moderate', 'mild'), allergen`,
    [residentId],
  );
  return rows;
}

export async function findAllergy(id) {
  const [rows] = await pool.query('SELECT id, resident_id AS residentId, allergen, type, reaction, severity FROM allergies WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createAllergy(residentId, { allergen, type, reaction, severity }) {
  const [r] = await pool.query('INSERT INTO allergies (resident_id, allergen, type, reaction, severity) VALUES (?, ?, ?, ?, ?)',
    [residentId, allergen, type, reaction ?? null, severity]);
  return r.insertId;
}

export async function updateAllergy(id, { allergen, type, reaction, severity }) {
  await pool.query('UPDATE allergies SET allergen = ?, type = ?, reaction = ?, severity = ? WHERE id = ?',
    [allergen, type, reaction ?? null, severity, id]);
}

export async function deleteAllergy(id) {
  await pool.query('DELETE FROM allergies WHERE id = ?', [id]);
}

export async function listConditions(residentId) {
  const [rows] = await pool.query(
    `SELECT id, resident_id AS residentId, name, since_date AS sinceDate, notes, created_at AS createdAt
       FROM health_conditions WHERE resident_id = ? ORDER BY since_date IS NULL, since_date DESC, name`,
    [residentId],
  );
  return rows;
}

export async function findCondition(id) {
  const [rows] = await pool.query('SELECT id, resident_id AS residentId, name, since_date AS sinceDate, notes FROM health_conditions WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createCondition(residentId, { name, sinceDate, notes }) {
  const [r] = await pool.query('INSERT INTO health_conditions (resident_id, name, since_date, notes) VALUES (?, ?, ?, ?)',
    [residentId, name, sinceDate ?? null, notes ?? null]);
  return r.insertId;
}

export async function updateCondition(id, { name, sinceDate, notes }) {
  await pool.query('UPDATE health_conditions SET name = ?, since_date = ?, notes = ? WHERE id = ?',
    [name, sinceDate ?? null, notes ?? null, id]);
}

export async function deleteCondition(id) {
  await pool.query('DELETE FROM health_conditions WHERE id = ?', [id]);
}
