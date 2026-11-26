import { z } from 'zod';

// Keep these rules in sync with client/src/validation/auth.js
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[A-Za-z]/, 'Password must contain a letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const activateSchema = z
  .object({
    token: z.string().min(20, 'This activation link is not valid.'),
    password: passwordRule,
    confirmPassword: z.string(),
    acceptPrivacy: z.literal(true, { error: 'You must accept the privacy notice to continue.' }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export const tokenParamSchema = z.object({ token: z.string().min(20, 'This activation link is not valid.') });
