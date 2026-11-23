const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const configured = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

if (!configured) {
  console.warn('S3 object storage is not configured: set AWS_ENDPOINT_URL_S3, S3_BUCKET, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  credentials: { accessKeyId, secretAccessKey },
});

const extensionFor = (mimeType) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}[mimeType]);

async function uploadBuffer(buffer, mimeType) {
  if (!configured) throw new Error('S3 object storage is not configured');

  const extension = extensionFor(mimeType);
  if (!extension) throw new Error('Unsupported image type');

  const key = `dairy-products/${crypto.randomUUID()}.${extension}`;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  const publicBase = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '');
  const url = publicBase
    ? `${publicBase}/${key}`
    : `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;

  return { url, key };
}

async function deleteImage(key) {
  if (!key || !configured) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = { uploadBuffer, deleteImage };
