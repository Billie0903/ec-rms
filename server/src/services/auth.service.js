import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken } from '../utils/tokens.js';
import * as userModel from '../models/user.model.js';
import * as inviteModel from '../models/invite.model.js';
import * as audit from './audit.service.js';

const BCRYPT_COST = 12;
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function toPublicUser(user) {
  const { password_hash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

export async function login({ email, password }, ip) {
  const user = await userModel.findByEmailWithHash(email);
  const passwordOk = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);

  if (!user || !passwordOk || !user.password_hash) {
    throw ApiError.unauthorized('Email or password is incorrect.');
  }
  if (user.status === 'disabled') {
    throw ApiError.forbidden('This account has been disabled. Please contact the center.');
  }

  await userModel.touchLastLogin(user.id);
  await audit.record({ actorId: user.id, action: 'auth.login', entityType: 'user', entityId: user.id, ip });

  return { user: toPublicUser(user), token: signToken(user) };
}

/** Look up an activation link without using it (for the activation page). */
export async function checkInvite(rawToken) {
  const invite = await inviteModel.findValidByTokenHash(hashToken(rawToken));
  assertInviteUsable(invite);
  return { fullName: invite.full_name, email: invite.email, role: invite.role };
}

/** Registration step: set a password with a valid invite token. */
export async function activate({ token, password }, ip) {
  const passwordHash = await hashPassword(password);

  const user = await withTransaction(async (conn) => {
    const invite = await inviteModel.findValidByTokenHash(hashToken(token), conn);
    assertInviteUsable(invite);

    await userModel.setPasswordAndActivate(invite.user_id, passwordHash, conn);
    await inviteModel.markUsed(invite.id, conn);
    await audit.record({ actorId: invite.user_id, action: 'auth.activate', entityType: 'user', entityId: invite.user_id, ip }, conn);
    return userModel.findById(invite.user_id, conn);
  });

  return { user, token: signToken(user) };
}

function assertInviteUsable(invite) {
  if (!invite) throw ApiError.notFound('This activation link is not valid.');
  if (invite.used_at) throw ApiError.gone('This activation link has already been used. Please log in.');
  if (new Date(invite.expires_at.replace(' ', 'T')) < new Date()) {
    throw ApiError.gone('This activation link has expired. Please ask the center for a new one.');
  }
  if (invite.user_status === 'disabled') throw ApiError.forbidden('This account has been disabled.');
}
