import { z } from 'zod';

export const idParam = z.object({ id: z.coerce.number().int().positive('Invalid id.') });

/** Optional text: trims, and turns '' into null so the DB stores NULL. */
export const optionalText = (max) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(max, `Must be at most ${max} characters.`).nullable().optional());

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Not a valid date.');

export function today() {
  return new Date().toISOString().slice(0, 10);
}
