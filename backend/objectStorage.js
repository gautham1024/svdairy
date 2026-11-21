const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const endpoint = process.env.NEON_S3_ENDPOINT;
const bucket = process.env.NEON_S3_BUCKET;

if (!endpoint || !bucket) {
  console.warn('S3 object storage is not configured: set NEON_S3_ENDPOINT and NEON_S3_BUCKET');
}

const s3 = new S3Client({
  region: process.env.NEON_S3_REGION || 'auto',
  endpoint,
  forcePathStyle: process.env.NEON_S3_FORCE_PATH_STYLE !== 'false',
  credentials: {
    accessKeyId: process.env.NEON_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEON_S3_SECRET_ACCESS_KEY,
  },
});

const extensionFor = (mimeType) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}[mimeType]);

async function uploadBuffer(buffer, mimeType) {
  if (!endpoint || !bucket) throw new Error('S3 object storage is not configured');

  const extension = extensionFor(mimeType);
  if (!extension) throw new Error('Unsupported image type');

  const key = `dairy-products/${crypto.randomUUID()}.${extension}`;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  const publicBase = (process.env.NEON_S3_PUBLIC_URL || '').replace(/\/$/, '');
  const url = publicBase
    ? `${publicBase}/${key}`
    : `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;

  return { url, key };
}

async function deleteImage(key) {
  if (!key || !bucket) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = { uploadBuffer, deleteImage };
