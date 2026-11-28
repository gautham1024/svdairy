import { prisma } from '@/lib/server/db';
import { adminOnly, fail, readJson } from '@/lib/server/http';

export const PATCH = adminOnly(async (req, { params }) => {
  const id = Number((await params).id);
  const { isActive } = await readJson(req);
  if (typeof isActive !== 'boolean') return fail('isActive must be true or false');
  if (!Number.isInteger(id)) return fail('Product not found', 404);
  return Response.json(await prisma.product.update({ where: { id }, data: { isActive } }));
});
