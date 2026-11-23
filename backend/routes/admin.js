const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const { uploadBuffer, deleteImage } = require('../objectStorage');

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

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  // Both compares run before combining, so timing doesn't reveal which one failed
  const emailOk = safeEqual(email, process.env.ADMIN_EMAIL);
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);
  const ok = emailOk && passOk;
  if (!ok) return res.status(401).json({ error: 'Wrong email or password' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, cookieOpts).json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: undefined }).json({ ok: true });
});

// Everything below needs a valid cookie
router.use(requireAuth);

router.get('/me', (req, res) => res.json({ ok: true }));

router.get('/products', async (req, res, next) => {
  try {
    res.json(await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

router.post('/products', upload.single('image'), async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const packSize = (req.body.packSize || '').trim();
    const description = (req.body.description || '').trim();
    const price = Number(req.body.price);
    if (!name || !packSize) return res.status(400).json({ error: 'Name and pack size are required' });
    if (!Number.isInteger(price) || price <= 0) return res.status(400).json({ error: 'Price must be a positive whole number' });
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    const img = await uploadBuffer(req.file.buffer, req.file.mimetype);
    const product = await prisma.product.create({
      data: { name, packSize, description, price, imageUrl: img.url, imageId: img.key },
    });
    res.status(201).json(product);
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
    await deleteImage(product.imageId);
    await prisma.product.delete({ where: { id: product.id } });
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
    };
    res.json(await prisma.settings.update({ where: { id: 1 }, data }));
  } catch (e) { next(e); }
});

// Latest 200 Buy-button taps
router.get('/clicks', async (req, res, next) => {
  try {
    res.json(await prisma.click.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  } catch (e) { next(e); }
});

module.exports = router;
