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

// Called when a visitor taps Buy. Fire-and-forget from the frontend.
router.post('/click', async (req, res, next) => {
  try {
    const { productId, productName } = req.body || {};
    if (!productName) return res.status(400).json({ error: 'productName required' });
    await prisma.click.create({
      data: {
        productId: Number.isInteger(productId) ? productId : null,
        productName: String(productName).slice(0, 200),
      },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
