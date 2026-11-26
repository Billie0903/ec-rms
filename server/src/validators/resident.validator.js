import { z } from 'zod';
import { isoDate, optionalText, today } from './common.js';

// Keep in sync with client/src/validation/resident.js
export const RESIDENT_STATUSES = ['active', 'hospital', 'discharged', 'deceased', 'archived'];
export const EDITABLE_STATUSES = ['active', 'hospital', 'discharged', 'deceased']; // 'archived' only via the archive flow
export const MOBILITY_LEVELS = ['independent', 'walking_aid', 'wheelchair', 'bedridden'];
export const FALL_RISKS = ['low', 'medium', 'high'];
export const GENDERS = ['male', 'female', 'other'];

function ageOn(dob, onDate = today()) {
  const [y, m, d] = dob.split('-').map(Number);
  const [ty, tm, td] = onDate.split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

const residentFields = {
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100, 'Full name must be at most 100 characters.'),
  dateOfBirth: isoDate.refine((d) => { const a = ageOn(d); return a >= 50 && a <= 120; }, 'Age must be between 50 and 120.'),
  gender: z.enum(GENDERS, { error: 'Choose a gender.' }),
  room: optionalText(20),
  admissionDate: isoDate.refine((d) => d <= today(), 'Admission date cannot be in the future.'),
  status: z.enum(EDITABLE_STATUSES, { error: 'Choose a valid status.' }).default('active'),
  mobilityLevel: z.enum(MOBILITY_LEVELS).default('independent'),
  fallRisk: z.enum(FALL_RISKS).default('low'),
  dietNotes: optionalText(255),
  cognitiveStatus: optionalText(255),
  primaryDoctor: optionalText(100),
  preferredHospital: optionalText(150),
  photoUrl: z.preprocess((v) => (v === '' ? null : v), z.string().url('Must be a valid URL.').max(500).nullable().optional()),
};

export const createResidentSchema = z.object(residentFields)
  .refine((r) => r.admissionDate >= r.dateOfBirth, { path: ['admissionDate'], message: 'Admission date must be after date of birth.' });

export const updateResidentSchema = createResidentSchema;

export const listResidentsQuery = z.object({
  q: z.string().trim().max(100).optional().default(''),
  status: z.enum([...RESIDENT_STATUSES, 'all']).optional(),
  fallRisk: z.enum(FALL_RISKS).optional(),
  sort: z.enum(['name', 'room', 'admissionDate', 'age']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const reasonSchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters.').max(500, 'Reason must be at most 500 characters.'),
});

export const reviewArchiveRequestSchema = z.object({
  decision: z.enum(['approve', 'reject'], { error: 'Decision must be approve or reject.' }),
  note: optionalText(500),
}).refine((d) => d.decision === 'approve' || (d.note && d.note.length >= 5), {
  path: ['note'], message: 'Please give a reason (at least 5 characters) when rejecting.',
});

export const archiveRequestsQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'all']).optional().default('pending'),
});
