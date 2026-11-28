import { prisma } from '@/lib/server/db';
import { adminOnly } from '@/lib/server/http';

export const GET = adminOnly(async () => {
  const admin = await prisma.admin.findUnique({ where: { id: 1 } });
  return Response.json({ ok: true, email: admin?.email || '' });
});
