import { badRequest } from './http';

// Same limits multer enforced: one optional image, jpg/png/webp, max 3 MB
export function readImage(form) {
  const file = form.get('image');
  if (!file || typeof file === 'string' || file.size === 0) return null;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw badRequest('Image must be jpg, png or webp');
  if (file.size > 3 * 1024 * 1024) throw badRequest('Image must be 3 MB or smaller');
  return file;
}

export const fileBuffer = async (file) => Buffer.from(await file.arrayBuffer());

// Non-multipart bodies read as an empty form so validation answers 400
export const readForm = (req) => req.formData().catch(() => new FormData());
