# Dairy site (Tier A)

## Backend
cd server && cp .env.example .env   # fill in values
npm install
npx prisma db push                   # creates tables in Neon
npm run dev                          # http://localhost:4000

## Frontend
cd frontend && cp .env.example .env.local
npm install
npm run dev                          # http://localhost:3000  (admin at /admin)

## Deploy notes
- Backend (Render): set NODE_ENV=production, DATABASE_URL=<your Neon PostgreSQL URL>, CLIENT_URL=<your Vercel URL>, and all auth values.
- Neon S3 object storage: set NEON_S3_ENDPOINT, NEON_S3_REGION, NEON_S3_BUCKET, NEON_S3_ACCESS_KEY_ID, NEON_S3_SECRET_ACCESS_KEY, and NEON_S3_PUBLIC_URL. Set NEON_S3_FORCE_PATH_STYLE=false only if your provider's endpoint uses virtual-hosted-style paths.
