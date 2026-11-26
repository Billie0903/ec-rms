import { AUTH_COOKIE } from '../middlewares/auth.js';
import { isProduction } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { ok, noContent } from '../utils/response.js';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};

export async function login(req, res) {
  const { user, token } = await authService.login(req.valid.body, req.ip);
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  ok(res, { user });
}

export async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  noContent(res);
}

export async function me(req, res) {
  ok(res, { user: req.user });
}

export async function checkInvite(req, res) {
  ok(res, await authService.checkInvite(req.valid.params.token));
}

export async function activate(req, res) {
  const { user, token } = await authService.activate(req.valid.body, req.ip);
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  ok(res, { user });
}
