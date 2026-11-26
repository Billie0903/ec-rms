import { z } from 'zod';
import { optionalText } from './common.js';

// Keep in sync with client/src/validation/admin.js
export const ROLES = ['admin', 'operator', 'relative'];
const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const phoneRule = z.preprocess((v) => (typeof v === 'string' ? v.replace(/[\s.-]/g, '') : v),
  z.string().regex(VN_PHONE, 'Enter a valid Vietnamese phone number.').nullable().optional().or(z.literal('').transform(() => null)));

export const newUserFields = {
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
  phone: phoneRule,
};

export const createUserSchema = z.object({ ...newUserFields, role: z.enum(ROLES, { error: 'Choose a role.' }) });

export const updateUserSchema = z.object({
  fullName: newUserFields.fullName.optional(),
  phone: phoneRule,
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'disabled', 'invited']).optional(),
});

export const listUsersQuery = z.object({
  role: z.enum(ROLES).optional(),
  q: z.string().trim().max(100).optional().default(''),
});

const linkFields = {
  relationship: z.string().trim().min(2, 'Relationship must be at least 2 characters.').max(50),
  accessLevel: z.enum(['full', 'basic']).default('basic'),
  isEmergencyContact: z.boolean().default(false),
  isLegalGuardian: z.boolean().default(false),
  consentNote: optionalText(255),
};

/** Link an existing relative account, or create a new one in the same step. */
export const createLinkSchema = z.object({
  relativeUserId: z.coerce.number().int().positive().optional(),
  newRelative: z.object(newUserFields).optional(),
  consentConfirmed: z.literal(true, { error: 'Confirm that consent has been recorded.' }),
  ...linkFields,
}).refine((d) => Boolean(d.relativeUserId) !== Boolean(d.newRelative), {
  path: ['relativeUserId'], message: 'Choose an existing relative or enter a new one.',
});

export const updateLinkSchema = z.object({
  relationship: linkFields.relationship.optional(),
  accessLevel: z.enum(['full', 'basic']).optional(),
  isEmergencyContact: z.boolean().optional(),
  isLegalGuardian: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const auditQuery = z.object({
  action: z.string().trim().max(50).optional(),
  entityType: z.string().trim().max(50).optional(),
  actorId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
