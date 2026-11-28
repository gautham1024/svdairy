import { prisma } from '@/lib/server/db';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { adminOnly, fail, readJson, tooManyAttempts } from '@/lib/server/http';

// shortcut: existing 8h login cookies stay valid after a password change; add a token version if that matters
export const PUT = adminOnly(async (req) => {
  if (tooManyAttempts(req)) return fail('Too many login attempts. Try again later.', 429);
  const { currentPassword, email, newPassword } = await readJson(req);
  const admin = await prisma.admin.findUnique({ where: { id: 1 } });
  if (!verifyPassword(currentPassword, admin?.passwordHash)) return fail('Current password is wrong');
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 200) return fail('Enter a valid email');
  const data = { email: cleanEmail };
  if (newPassword) {
    const pw = String(newPassword);
    if (pw.length < 8 || pw.length > 200) return fail('New password must be at least 8 characters');
    data.passwordHash = hashPassword(pw);
  }
  await prisma.admin.update({ where: { id: 1 }, data });
  return Response.json({ ok: true });
});
