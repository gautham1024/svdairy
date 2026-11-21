const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma 7 connects through a driver adapter instead of the schema url
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

module.exports = new PrismaClient({ adapter });