import crypto from 'node:crypto';

/** A random URL-safe token for activation links. Only its hash is stored. */
export function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
