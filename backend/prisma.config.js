require('dotenv/config');
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // process.env instead of env() so `prisma generate` doesn't fail when DATABASE_URL isn't set yet
    url: process.env.DATABASE_URL,
  },
});