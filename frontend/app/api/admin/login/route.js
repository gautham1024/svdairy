import crypto from 'crypto';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma, ensureSetup } from '@/lib/server/db';
import { verifyPassword } from '@/lib/server/password';
import { handle, fail, readJson, cookieOpts, tooManyAttempts } from '@/lib/server/http';

// Hash first so both buffers have equal length (timingSafeEqual requires it)
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export const POST = handle(async (req) => {
  if (tooManyAttempts(req)) return fail('Too many login attempts. Try again later.', 429);
  const { email, password } = await readJson(req);
  await ensureSetup();
  const admin = await prisma.admin.findUnique({ where: { id: 1 } });
  // Both checks run before combining, so timing doesn't reveal which one failed
  const emailOk = safeEqual(String(email ?? '').trim().toLowerCase(), admin?.email);
  const passOk = verifyPassword(password, admin?.passwordHash);
  if (!(emailOk && passOk)) return fail('Wrong email or password', 401);
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  (await cookies()).set('token', token, cookieOpts);
  return Response.json({ ok: true });
});
