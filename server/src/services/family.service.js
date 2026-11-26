import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as relativeModel from '../models/relative.model.js';
import * as residentModel from '../models/resident.model.js';
import * as health from '../models/health.model.js';
import * as care from '../models/care.model.js';

/**
 * Everything a relative sees goes through here. Access is decided on the
 * server from resident_relatives; the React app only hides what it never receives.
 */
export function listResidents(user) {
  return relativeModel.listLinkedResidents(user.id);
}

export async function getResident(residentId, user) {
  const link = await relativeModel.findActiveLink(residentId, user.id);
  // 404, not 403: don't reveal whether another resident exists.
  if (!link) throw ApiError.notFound('Resident not found.');

  const r = await residentModel.findById(residentId);
  const resident = {
    id: r.id, fullName: r.fullName, age: r.age, gender: r.gender, room: r.room, photoUrl: r.photoUrl,
    status: r.status, admissionDate: r.admissionDate,
  };

  const [schedules, summaries] = await Promise.all([
    care.listSchedules(residentId, { when: 'upcoming' }),
    publishedSummaries(residentId),
  ]);
  const out = { resident, relationship: link.relationship, accessLevel: link.accessLevel, schedules, summaries };

  if (link.accessLevel === 'full') {
    const [allergies, conditions, medications, vitals, notes] = await Promise.all([
      health.listAllergies(residentId),
      health.listConditions(residentId),
      care.listMedications(residentId, { includeStopped: false }),
      care.listVitals(residentId, { days: 14 }),
      care.listCareNotes(residentId, {}),
    ]);
    Object.assign(out, {
      resident: { ...resident, mobilityLevel: r.mobilityLevel, dietNotes: r.dietNotes, primaryDoctor: r.primaryDoctor, preferredHospital: r.preferredHospital },
      allergies: allergies.map(({ allergen, type, reaction, severity, id }) => ({ id, allergen, type, reaction, severity })),
      conditions: conditions.map(({ id, name, sinceDate }) => ({ id, name, sinceDate })),
      medications: medications.map(({ id, name, dosage, route, timesOfDay, instructions }) => ({ id, name, dosage, route, timesOfDay, instructions })),
      vitals: vitals.map(({ recordedByName, ...v }) => v), // eslint-disable-line no-unused-vars
      // Only notes staff marked as visible to family; never internal notes.
      careNotes: notes.filter((n) => n.visibleToFamily).slice(0, 30)
        .map(({ id, category, note, createdAt }) => ({ id, category, note, createdAt })),
    });
  }
  return out;
}

async function publishedSummaries(residentId) {
  const [rows] = await pool.query(
    `SELECT id, week_start AS weekStart, content, published_at AS publishedAt
       FROM weekly_summaries WHERE resident_id = ? AND published_at IS NOT NULL
      ORDER BY week_start DESC LIMIT 8`,
    [residentId]);
  return rows;
}
