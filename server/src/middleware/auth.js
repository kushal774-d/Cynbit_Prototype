import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const AUTH_COOKIE = 'admin_token';

export const cookieOptions = {
  httpOnly: true, // JavaScript in the browser can't read it, so XSS can't steal it
  sameSite: 'strict', // not sent on cross-site requests, which blocks CSRF
  secure: env.isProd, // HTTPS only in production
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  path: '/',
};

export function signAdminToken(admin) {
  return jwt.sign({ sub: admin._id.toString(), email: admin.email }, env.jwtSecret, {
    expiresIn: '8h',
  });
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
    return res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}
