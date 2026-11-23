# Dairy site (Tier A)

## Backend
cd backend && cp .env.example .env   # fill in values
npm install
npx prisma db push                   # creates tables in Neon
npm run dev                          # http://localhost:4000

## Frontend
cd frontend && cp .env.example .env.local
npm install
npm run dev                          # http://localhost:3000  (admin at /admin)

## Deploy notes
- Backend (Render): set NODE_ENV=production, DATABASE_URL (Neon direct), DATABASE_URL_POOLED (Neon pooled), CLIENT_URL=<your Vercel URL>, and all auth values.
- Neon S3 object storage: set AWS_ENDPOINT_URL_S3, AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY. Set S3_FORCE_PATH_STYLE=false only if your provider's endpoint uses virtual-hosted-style paths.
- Product images are loaded straight from the bucket by the browser, so the bucket must allow public reads. If it is served from a different address, set S3_PUBLIC_URL to that base URL.
