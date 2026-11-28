import { prisma, ensureSetup } from '@/lib/server/db';
import { handle } from '@/lib/server/http';

export const GET = handle(async () => {
  await ensureSetup();
  return Response.json(await prisma.settings.findUnique({ where: { id: 1 } }));
});
