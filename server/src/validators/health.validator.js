import { z } from 'zod';
import { isoDate, optionalText, today } from './common.js';

export const allergySchema = z.object({
  allergen: z.string().trim().min(2, 'Allergen must be at least 2 characters.').max(100),
  type: z.enum(['drug', 'food', 'other'], { error: 'Choose a type.' }),
  reaction: optionalText(255),
  severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
});

export const conditionSchema = z.object({
  name: z.string().trim().min(2, 'Condition must be at least 2 characters.').max(150),
  sinceDate: isoDate.refine((d) => d <= today(), 'Date cannot be in the future.').nullable().optional()
    .or(z.literal('').transform(() => null)),
  notes: optionalText(255),
});
