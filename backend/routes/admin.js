const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const { uploadBuffer, deleteImage } = require('../objectStorage');
const { hashPassword, verifyPassword } = require('../password');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(null, true);
    const err = new Error('Image must be jpg, png or webp');
    err.status = 400;
    cb(err);
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.' },
});

// Hash first so both buffers have equal length (timingSafeEqual requires it)
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const isProd = process.env.NODE_ENV === 'production';
const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  // Vercel and Render are different sites, so production needs sameSite none
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 8 * 60 * 60 * 1000,
};

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const admin = await prisma.admin.findUnique({ where: { id: 1 } });
    // Both checks run before combining, so timing doesn't reveal which one failed
    const emailOk = safeEqual(String(email ?? '').trim().toLowerCase(), admin?.email);
    const passOk = verifyPassword(password, admin?.passwordHash);
    if (!(emailOk && passOk)) return res.status(401).json({ error: 'Wrong email or password' });
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie('token', token, cookieOpts).json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: undefined }).json({ ok: true });
});

// Everything below needs a valid cookie
router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: 1 } });
    res.json({ ok: true, email: admin?.email || '' });
  } catch (e) { next(e); }
});

// shortcut: existing 8h login cookies stay valid after a password change; add a token version if that matters
router.put('/account', loginLimiter, async (req, res, next) => {
  try {
    const { currentPassword, email, newPassword } = req.body || {};
    const admin = await prisma.admin.findUnique({ where: { id: 1 } });
    if (!verifyPassword(currentPassword, admin?.passwordHash)) return res.status(400).json({ error: 'Current password is wrong' });
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 200) return res.status(400).json({ error: 'Enter a valid email' });
    const data = { email: cleanEmail };
    if (newPassword) {
      const pw = String(newPassword);
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      data.passwordHash = hashPassword(pw);
    }
    await prisma.admin.update({ where: { id: 1 }, data });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/products', async (req, res, next) => {
  try {
    res.json(await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

router.post('/products', upload.single('image'), async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();
    let variants;
    try { variants = JSON.parse(req.body.variants || '[]'); } catch { variants = null; }
    if (!Array.isArray(variants) || variants.length === 0 || variants.length > 10) {
      return res.status(400).json({ error: 'Add between 1 and 10 quantities' });
    }
    variants = variants.map((v) => ({ packSize: String(v?.packSize ?? '').trim(), price: Number(v?.price) }));
    if (!name || variants.some((v) => !v.packSize)) return res.status(400).json({ error: 'Name and pack size are required' });
    if (variants.some((v) => !Number.isInteger(v.price) || v.price <= 0)) return res.status(400).json({ error: 'Price must be a positive whole number' });
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    // One image shared by every size row
    const img = await uploadBuffer(req.file.buffer, req.file.mimetype);
    const { count } = await prisma.product.createMany({
      data: variants.map((v) => ({ name, description, ...v, imageUrl: img.url, imageId: img.key })),
    });
    res.status(201).json({ count });
  } catch (e) { next(e); }
});

router.put('/products/:id', upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await prisma.product.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ error: 'Product not found' });
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();
    const packSize = (req.body.packSize || '').trim();
    const price = Number(req.body.price);
    if (!name || !packSize) return res.status(400).json({ error: 'Name and pack size are required' });
    if (!Number.isInteger(price) || price <= 0) return res.status(400).json({ error: 'Price must be a positive whole number' });

    const data = { name, description, packSize, price };
    if (req.file) {
      const img = await uploadBuffer(req.file.buffer, req.file.mimetype);
      data.imageUrl = img.url;
      data.imageId = img.key;
    }
    const product = await prisma.product.update({ where: { id }, data });
    // Old image may be shared with other sizes; remove it only once nothing uses it
    if (req.file && old.imageId && !(await prisma.product.count({ where: { imageId: old.imageId } }))) {
      await deleteImage(old.imageId);
    }
    res.json(product);
  } catch (e) { next(e); }
});

router.patch('/products/:id/active', async (req, res, next) => {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be true or false' });
    const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data: { isActive } });
    res.json(product);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(e);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await prisma.product.delete({ where: { id: product.id } });
    // Other sizes may still use the same image; only remove it when the last one goes
    const stillUsed = product.imageId && await prisma.product.count({ where: { imageId: product.imageId } });
    if (!stillUsed) await deleteImage(product.imageId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const clean = (v) => String(v ?? '').trim().slice(0, 300);
    const data = {
      whatsappNumber: clean(req.body.whatsappNumber).replace(/\D/g, ''), // digits only
      phone: clean(req.body.phone),
      address: clean(req.body.address),
      facebookUrl: clean(req.body.facebookUrl),
      instagramUrl: clean(req.body.instagramUrl),
      youtubeUrl: clean(req.body.youtubeUrl),
      fssaiNumber: clean(req.body.fssaiNumber),
      hours: clean(req.body.hours),
      maxCartQty: Number(req.body.maxCartQty),
    };
    if (!Number.isInteger(data.maxCartQty) || data.maxCartQty < 1 || data.maxCartQty > 99) {
      return res.status(400).json({ error: 'Max quantity must be a whole number from 1 to 99' });
    }
    res.json(await prisma.settings.update({ where: { id: 1 }, data }));
  } catch (e) { next(e); }
});

// Order taps, optionally filtered: ?from=ISO&to=ISO&products=name1|name2
router.get('/clicks', async (req, res, next) => {
  try {
    const where = {};
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    if ((from && isNaN(from)) || (to && isNaN(to))) return res.status(400).json({ error: 'Invalid date' });
    if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
    const products = String(req.query.products || '').split('|').filter(Boolean);
    if (products.length) where.items = { some: { productName: { in: products } } };
    // shortcut: capped at 500 rows, add pagination if orders grow past that
    res.json(await prisma.click.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 500 }));
  } catch (e) { next(e); }
});

// Product names ever ordered, for the filter dropdown (includes deleted products)
router.get('/clicks/products', async (req, res, next) => {
  try {
    const rows = await prisma.clickItem.findMany({ distinct: ['productName'], select: { productName: true }, orderBy: { productName: 'asc' } });
    res.json(rows.map((r) => r.productName));
  } catch (e) { next(e); }
});

module.exports = router;
