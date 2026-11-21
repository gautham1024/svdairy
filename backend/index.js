require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const prisma = require('./db');

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
  app.listen(process.env.PORT || 4000, () => console.log('API running on port', process.env.PORT || 4000));
}
start();
