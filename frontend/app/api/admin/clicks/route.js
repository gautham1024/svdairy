import { prisma } from '@/lib/server/db';
import { adminOnly, fail } from '@/lib/server/http';

// Order taps, optionally filtered: ?from=ISO&to=ISO&products=name1|name2
export const GET = adminOnly(async (req) => {
  const q = req.nextUrl.searchParams;
  const where = {};
  const from = q.get('from') ? new Date(q.get('from')) : null;
  const to = q.get('to') ? new Date(q.get('to')) : null;
  if ((from && isNaN(from)) || (to && isNaN(to))) return fail('Invalid date');
  if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
  const products = String(q.get('products') || '').split('|').filter(Boolean);
  if (products.length) where.items = { some: { productName: { in: products } } };
  // shortcut: capped at 500 rows, add pagination if orders grow past that
  return Response.json(await prisma.click.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 500 }));
});
