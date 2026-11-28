import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const fail = (error, status = 400) => Response.json({ error }, { status });

export const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Malformed or missing JSON reads as {} so the route's own validation answers 400
export const readJson = (req) => req.json().catch(() => ({}));

// Same rules as the old Express error handler
export const handle = (fn) => async (req, ctx) => {
  try {
    return await fn(req, ctx);
  } catch (e) {
    if (e.status === 400) return fail(e.message);
    if (e.code === 'P2025') return fail('Not found', 404);
    console.error(e);
    return fail('Something went wrong', 500);
  }
};

export const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // site and API share one origin now
  maxAge: 8 * 60 * 60, // seconds
  path: '/',
};

// Wraps a handler so it only runs with a valid admin cookie
export const adminOnly = (fn) => handle(async (req, ctx) => {
  try {
    jwt.verify((await cookies()).get('token')?.value, process.env.JWT_SECRET);
  } catch {
    return fail('Not logged in', 401);
  }
  return fn(req, ctx);
});

// shortcut: in-memory, so each serverless instance counts separately; move to a Neon table if brute force becomes a concern
const hits = new Map();
export function tooManyAttempts(req, max = 10, windowMs = 15 * 60 * 1000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { count: 1, reset: now + windowMs }); return false; }
  return ++h.count > max;
}
