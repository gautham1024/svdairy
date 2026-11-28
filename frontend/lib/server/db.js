import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from './password';

// Prisma 7 connects through a driver adapter instead of the schema url.
// Neon's pooled URL suits the running app; the direct DATABASE_URL is for `prisma db push`.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL });

// Reused across dev hot reloads so we don't open a new pool each time
export const prisma = globalThis.prisma ??= new PrismaClient({ adapter });

async function setup() {
  // Make sure the single settings row exists
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  // First run: seed the admin login from env; after that it is changed from the admin panel
  if (!(await prisma.admin.findUnique({ where: { id: 1 } }))) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD for the first run');
    await prisma.admin.create({ data: { id: 1, email: process.env.ADMIN_EMAIL.trim().toLowerCase(), passwordHash: hashPassword(process.env.ADMIN_PASSWORD) } });
  }
}

// Serverless has no startup hook, so the first request that needs the rows runs setup once per instance
let ready;
export const ensureSetup = () => (ready ??= setup().catch((e) => { ready = null; throw e; }));
