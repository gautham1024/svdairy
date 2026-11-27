const router = require('express').Router();
const prisma = require('../db');

router.get('/health', (req, res) => res.json({ ok: true }));

router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (e) { next(e); }
});

router.get('/settings', async (req, res, next) => {
  try {
    res.json(await prisma.settings.findUnique({ where: { id: 1 } }));
  } catch (e) { next(e); }
});

// Called when a visitor taps "Order on WhatsApp" in the cart. Fire-and-forget from the frontend.
router.post('/click', async (req, res, next) => {
  try {
    const { items, address, latitude, longitude } = req.body || {};
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) return res.status(400).json({ error: 'items required' });
    const { maxCartQty } = await prisma.settings.findUnique({ where: { id: 1 } });
    const rows = items.map((i) => ({
      productId: Number.isInteger(i?.productId) ? i.productId : null,
      productName: String(i?.productName ?? '').slice(0, 200),
      qty: i?.qty,
      price: i?.price,
    }));
    const bad = (r) => !r.productName || !Number.isInteger(r.qty) || r.qty < 1 || r.qty > maxCartQty
      || !Number.isInteger(r.price) || r.price < 0;
    if (rows.some(bad)) return res.status(400).json({ error: 'Invalid item' });
    await prisma.click.create({
      data: {
        total: rows.reduce((sum, r) => sum + r.qty * r.price, 0),
        items: { create: rows },
        address: typeof address === 'string' && address ? address.slice(0, 500) : null,
        latitude: num(latitude),
        longitude: num(longitude),
      },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
