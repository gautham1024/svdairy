# Dairy site (Tier A)

One Next.js app: the site, the admin panel (`/admin`) and the API (`app/api/*`) all live in `frontend/`.

## Run locally
cd frontend && cp .env.example .env   # fill in values
npm install                          # also runs `prisma generate`
npx prisma db push                   # creates tables in Neon (first time / schema changes)
npm run dev                          # http://localhost:3000  (admin at /admin)

## Deploy (Vercel, single project)
- Root directory: `frontend`. Build command and output: Next.js defaults.
- Env vars: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seeds the first admin login only), `DATABASE_URL` (Neon direct), `DATABASE_URL_POOLED` (Neon pooled), `NEXT_PUBLIC_SITE_URL` (your site URL).
- Neon S3 object storage: set AWS_ENDPOINT_URL_S3, AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY. Set S3_FORCE_PATH_STYLE=false only if your provider's endpoint uses virtual-hosted-style paths.
- Product images are loaded straight from the bucket by the browser, so the bucket must allow public reads. If it is served from a different address, set S3_PUBLIC_URL to that base URL.
- Product images are capped at 3 MB (Vercel's request body limit is 4.5 MB).
