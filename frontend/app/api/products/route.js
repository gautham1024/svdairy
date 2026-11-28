import { prisma } from '@/lib/server/db';
import { handle } from '@/lib/server/http';

export const GET = handle(async () => Response.json(await prisma.product.findMany({
  where: { isActive: true },
  orderBy: { createdAt: 'desc' },
})));
