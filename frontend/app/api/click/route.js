import { prisma, ensureSetup } from '@/lib/server/db';
import { handle, fail, readJson } from '@/lib/server/http';

// Called when a visitor taps "Order on WhatsApp" in the cart. Fire-and-forget from the frontend.
export const POST = handle(async (req) => {
  const { items, address, latitude, longitude } = await readJson(req);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return fail('items required');
  await ensureSetup();
  const { maxCartQty } = await prisma.settings.findUnique({ where: { id: 1 } });
  const rows = items.map((i) => ({
    productId: Number.isInteger(i?.productId) ? i.productId : null,
    productName: String(i?.productName ?? '').slice(0, 200),
    qty: i?.qty,
    price: i?.price,
  }));
  const bad = (r) => !r.productName || !Number.isInteger(r.qty) || r.qty < 1 || r.qty > maxCartQty
    || !Number.isInteger(r.price) || r.price < 0;
  if (rows.some(bad)) return fail('Invalid item');
  await prisma.click.create({
    data: {
      total: rows.reduce((sum, r) => sum + r.qty * r.price, 0),
      items: { create: rows },
      address: typeof address === 'string' && address ? address.slice(0, 500) : null,
      latitude: num(latitude),
      longitude: num(longitude),
    },
  });
  return Response.json({ ok: true });
});
