const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma 7 connects through a driver adapter instead of the schema url.
// Neon's pooled URL suits the running app; the direct DATABASE_URL is for `prisma db push`.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL });

module.exports = new PrismaClient({ adapter });
