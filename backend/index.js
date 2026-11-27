require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const prisma = require('./db');
const { hashPassword } = require('./password');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy; needed for rate limiting + secure cookies
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err.status !== 400) console.error(err);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
});

async function start() {
  // Make sure the single settings row exists
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  // First run: seed the admin login from env; after that it is changed from the admin panel
  if (!(await prisma.admin.findUnique({ where: { id: 1 } }))) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD for the first run');
    await prisma.admin.create({ data: { id: 1, email: process.env.ADMIN_EMAIL.trim().toLowerCase(), passwordHash: hashPassword(process.env.ADMIN_PASSWORD) } });
  }
  app.listen(process.env.PORT || 4000, () => console.log('API running on port', process.env.PORT || 4000));
}
start();
