import { pool } from '../config/db.js';

// ---------- Medications ----------
const MED = `SELECT id, resident_id AS residentId, name, dosage, route, times_of_day AS timesOfDay, instructions,
                    start_date AS startDate, end_date AS endDate, prescribed_by AS prescribedBy, active
               FROM medications`;

const parseMed = (m) => m && ({ ...m, active: Boolean(m.active), timesOfDay: typeof m.timesOfDay === 'string' ? JSON.parse(m.timesOfDay) : m.timesOfDay });

export async function listMedications(residentId, { includeStopped }) {
  const [rows] = await pool.query(`${MED} WHERE resident_id = ? ${includeStopped ? '' : 'AND active = 1'} ORDER BY active DESC, name`, [residentId]);
  return rows.map(parseMed);
}
export async function findMedication(id) {
  const [rows] = await pool.query(`${MED} WHERE id = ?`, [id]);
  return parseMed(rows[0]) || null;
}
export async function createMedication(residentId, m) {
  const [r] = await pool.query(
    `INSERT INTO medications (resident_id, name, dosage, route, times_of_day, instructions, start_date, end_date, prescribed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [residentId, m.name, m.dosage, m.route, JSON.stringify(m.timesOfDay), m.instructions ?? null, m.startDate, m.endDate ?? null, m.prescribedBy ?? null]);
  return r.insertId;
}
export async function updateMedication(id, m) {
  await pool.query(
    `UPDATE medications SET name = ?, dosage = ?, route = ?, times_of_day = ?, instructions = ?, start_date = ?, end_date = ?, prescribed_by = ? WHERE id = ?`,
    [m.name, m.dosage, m.route, JSON.stringify(m.timesOfDay), m.instructions ?? null, m.startDate, m.endDate ?? null, m.prescribedBy ?? null, id]);
}
export async function stopMedication(id) {
  await pool.query('UPDATE medications SET active = 0, end_date = COALESCE(end_date, CURDATE()) WHERE id = ?', [id]);
}

// ---------- Vital signs ----------
const VIT = `SELECT v.id, v.resident_id AS residentId, v.measured_at AS measuredAt, v.bp_systolic AS bpSystolic, v.bp_diastolic AS bpDiastolic,
                    v.pulse, v.temperature_c AS temperatureC, v.spo2, v.weight_kg AS weightKg, v.blood_sugar_mmol AS bloodSugarMmol,
                    u.full_name AS recordedByName
               FROM vital_signs v LEFT JOIN users u ON u.id = v.recorded_by`;
const numify = (v) => v && ({ ...v, temperatureC: v.temperatureC == null ? null : Number(v.temperatureC),
  weightKg: v.weightKg == null ? null : Number(v.weightKg), bloodSugarMmol: v.bloodSugarMmol == null ? null : Number(v.bloodSugarMmol) });

export async function listVitals(residentId, { days }) {
  const [rows] = await pool.query(`${VIT} WHERE v.resident_id = ? AND v.measured_at >= NOW() - INTERVAL ? DAY ORDER BY v.measured_at DESC`, [residentId, days]);
  return rows.map(numify);
}
export async function findVitals(id) {
  const [rows] = await pool.query(`${VIT} WHERE v.id = ?`, [id]);
  return numify(rows[0]) || null;
}
export async function createVitals(residentId, v, userId) {
  const [r] = await pool.query(
    `INSERT INTO vital_signs (resident_id, measured_at, bp_systolic, bp_diastolic, pulse, temperature_c, spo2, weight_kg, blood_sugar_mmol, recorded_by)
     VALUES (?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?, ?, ?)`,
    [residentId, v.measuredAt ?? null, v.bpSystolic ?? null, v.bpDiastolic ?? null, v.pulse ?? null, v.temperatureC ?? null, v.spo2 ?? null, v.weightKg ?? null, v.bloodSugarMmol ?? null, userId]);
  return r.insertId;
}

// ---------- Care notes ----------
const NOTE = `SELECT n.id, n.resident_id AS residentId, n.category, n.note, n.visible_to_family AS visibleToFamily,
                     n.author_id AS authorId, u.full_name AS authorName, n.created_at AS createdAt, n.updated_at AS updatedAt
                FROM care_notes n LEFT JOIN users u ON u.id = n.author_id`;
const boolNote = (n) => n && ({ ...n, visibleToFamily: Boolean(n.visibleToFamily) });

export async function listCareNotes(residentId, { category }) {
  const params = [residentId];
  let extra = '';
  if (category) { extra = 'AND n.category = ?'; params.push(category); }
  const [rows] = await pool.query(`${NOTE} WHERE n.resident_id = ? ${extra} ORDER BY n.created_at DESC LIMIT 200`, params);
  return rows.map(boolNote);
}
export async function findCareNote(id) {
  const [rows] = await pool.query(`${NOTE} WHERE n.id = ?`, [id]);
  return boolNote(rows[0]) || null;
}
export async function createCareNote(residentId, n, userId) {
  const [r] = await pool.query('INSERT INTO care_notes (resident_id, category, note, visible_to_family, author_id) VALUES (?, ?, ?, ?, ?)',
    [residentId, n.category, n.note, n.visibleToFamily, userId]);
  return r.insertId;
}
export async function updateCareNote(id, n) {
  await pool.query('UPDATE care_notes SET category = ?, note = ?, visible_to_family = ? WHERE id = ?', [n.category, n.note, n.visibleToFamily, id]);
}
export async function deleteCareNote(id) {
  await pool.query('DELETE FROM care_notes WHERE id = ?', [id]);
}

// ---------- Schedules ----------
const SCH = `SELECT id, resident_id AS residentId, title, type, start_at AS startAt, end_at AS endAt, location, notes FROM schedules`;

export async function listSchedules(residentId, { when }) {
  const sql = when === 'past'
    ? `${SCH} WHERE resident_id = ? AND COALESCE(end_at, start_at) < NOW() ORDER BY start_at DESC LIMIT 100`
    : `${SCH} WHERE resident_id = ? AND COALESCE(end_at, start_at) >= NOW() ORDER BY start_at ASC LIMIT 100`;
  const [rows] = await pool.query(sql, [residentId]);
  return rows;
}
export async function findSchedule(id) {
  const [rows] = await pool.query(`${SCH} WHERE id = ?`, [id]);
  return rows[0] || null;
}
export async function createSchedule(residentId, s) {
  const [r] = await pool.query('INSERT INTO schedules (resident_id, title, type, start_at, end_at, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [residentId, s.title, s.type, s.startAt, s.endAt ?? null, s.location ?? null, s.notes ?? null]);
  return r.insertId;
}
export async function updateSchedule(id, s) {
  await pool.query('UPDATE schedules SET title = ?, type = ?, start_at = ?, end_at = ?, location = ?, notes = ? WHERE id = ?',
    [s.title, s.type, s.startAt, s.endAt ?? null, s.location ?? null, s.notes ?? null, id]);
}
export async function deleteSchedule(id) {
  await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
}
