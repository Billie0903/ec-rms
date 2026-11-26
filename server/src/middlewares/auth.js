import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import * as userModel from '../models/user.model.js';

export const AUTH_COOKIE = 'ec_rms_token';

/** Reads the JWT cookie, loads the user, and rejects disabled accounts. */
export async function authenticate(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  const user = await userModel.findById(payload.sub);
  if (!user || user.status !== 'active') throw ApiError.unauthorized();

  req.user = user;
  next();
}

/** Allow only the listed roles: requireRole('admin', 'operator') */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}
