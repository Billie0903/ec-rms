import { z } from 'zod';
import { isoDate, optionalText } from './common.js';

// Keep in sync with client/src/validation/care.js
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;
const dateTime = z.string().regex(DATETIME, 'Use the format YYYY-MM-DDTHH:MM.').transform((s) => s.replace('T', ' ').slice(0, 16) + ':00');

const optionalNumber = (min, max, label) => z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number({ error: `${label} must be a number.` }).min(min, `${label} must be between ${min} and ${max}.`).max(max, `${label} must be between ${min} and ${max}.`).nullable(),
).optional();

export const medicationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(150),
  dosage: z.string().trim().min(1, 'Dosage is required.').max(50),
  route: z.enum(['oral', 'injection', 'topical', 'inhaled', 'other']).default('oral'),
  timesOfDay: z.array(z.string().regex(TIME, 'Times must be HH:MM.')).min(1, 'Add at least one time.').max(8)
    .transform((t) => [...new Set(t)].sort()),
  instructions: optionalText(255),
  startDate: isoDate,
  endDate: isoDate.nullable().optional().or(z.literal('').transform(() => null)),
  prescribedBy: optionalText(100),
}).refine((m) => !m.endDate || m.endDate >= m.startDate, { path: ['endDate'], message: 'End date cannot be before start date.' });

export const medicationListQuery = z.object({ includeStopped: z.enum(['true', 'false']).optional().default('false') });

export const vitalsSchema = z.object({
  measuredAt: dateTime.optional(),
  bpSystolic: optionalNumber(50, 250, 'Systolic pressure'),
  bpDiastolic: optionalNumber(30, 150, 'Diastolic pressure'),
  pulse: optionalNumber(30, 200, 'Pulse'),
  temperatureC: optionalNumber(34, 42, 'Temperature'),
  spo2: optionalNumber(50, 100, 'SpO2'),
  weightKg: optionalNumber(20, 200, 'Weight'),
  bloodSugarMmol: optionalNumber(1, 35, 'Blood sugar'),
})
  .refine((v) => (v.bpSystolic == null) === (v.bpDiastolic == null), { path: ['bpDiastolic'], message: 'Enter both blood pressure values.' })
  .refine((v) => ['bpSystolic', 'pulse', 'temperatureC', 'spo2', 'weightKg', 'bloodSugarMmol'].some((k) => v[k] != null),
    { path: ['bpSystolic'], message: 'Enter at least one measurement.' });

export const vitalsListQuery = z.object({ days: z.coerce.number().int().min(1).max(365).optional().default(30) });

export const NOTE_CATEGORIES = ['daily', 'health', 'incident', 'activity'];
export const careNoteSchema = z.object({
  category: z.enum(NOTE_CATEGORIES).default('daily'),
  note: z.string().trim().min(5, 'Note must be at least 5 characters.').max(2000, 'Note must be at most 2000 characters.'),
  visibleToFamily: z.boolean().default(false),
});
export const careNoteListQuery = z.object({ category: z.enum(NOTE_CATEGORIES).optional() });

export const scheduleSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(150),
  type: z.enum(['activity', 'appointment', 'therapy', 'visit']).default('activity'),
  startAt: dateTime,
  endAt: dateTime.nullable().optional().or(z.literal('').transform(() => null)),
  location: optionalText(150),
  notes: optionalText(255),
}).refine((s) => !s.endAt || s.endAt >= s.startAt, { path: ['endAt'], message: 'End time cannot be before start time.' });

export const scheduleListQuery = z.object({ when: z.enum(['upcoming', 'past']).optional().default('upcoming') });
