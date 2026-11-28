import { prisma } from '@/lib/server/db';
import { adminOnly } from '@/lib/server/http';

// Product names ever ordered, for the filter dropdown (includes deleted products)
export const GET = adminOnly(async () => {
  const rows = await prisma.clickItem.findMany({ distinct: ['productName'], select: { productName: true }, orderBy: { productName: 'asc' } });
  return Response.json(rows.map((r) => r.productName));
});
