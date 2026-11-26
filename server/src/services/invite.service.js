import { env } from '../config/env.js';
import * as inviteModel from '../models/invite.model.js';
import { generateToken, hashToken } from '../utils/tokens.js';
import { sendActivationEmail } from './mail.service.js';

/** Create a single-use activation link. Returns the link (shown once to the Admin). */
export async function createInvite(user, createdBy, conn) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + env.inviteTtlHours * 3600 * 1000);
  await inviteModel.invalidateForUser(user.id, conn);
  await inviteModel.create({ userId: user.id, tokenHash: hashToken(token), expiresAt, createdBy }, conn);
  return `${env.clientUrl}/activate/${token}`;
}

export async function deliverInvite(user, link) {
  const { sent } = await sendActivationEmail({ to: user.email, fullName: user.full_name, link });
  return { activationLink: link, emailSent: sent };
}
