import { prisma } from '@/lib/server/db';
import { uploadBuffer, deleteImage } from '@/lib/server/objectStorage';
import { adminOnly, fail } from '@/lib/server/http';
import { readForm, readImage, fileBuffer } from '@/lib/server/image';

export const PUT = adminOnly(async (req, { params }) => {
  const id = Number((await params).id);
  const form = await readForm(req);
  const file = readImage(form);
  const old = Number.isInteger(id) && await prisma.product.findUnique({ where: { id } });
  if (!old) return fail('Product not found', 404);
  const name = String(form.get('name') || '').trim();
  const description = String(form.get('description') || '').trim();
  const packSize = String(form.get('packSize') || '').trim();
  const price = Number(form.get('price'));
  if (!name || !packSize) return fail('Name and pack size are required');
  if (!Number.isInteger(price) || price <= 0) return fail('Price must be a positive whole number');

  const data = { name, description, packSize, price };
  if (file) {
    const img = await uploadBuffer(await fileBuffer(file), file.type);
    data.imageUrl = img.url;
    data.imageId = img.key;
  }
  const product = await prisma.product.update({ where: { id }, data });
  // Old image may be shared with other sizes; remove it only once nothing uses it
  if (file && old.imageId && !(await prisma.product.count({ where: { imageId: old.imageId } }))) {
    await deleteImage(old.imageId);
  }
  return Response.json(product);
});

export const DELETE = adminOnly(async (req, { params }) => {
  const id = Number((await params).id);
  const product = Number.isInteger(id) && await prisma.product.findUnique({ where: { id } });
  if (!product) return fail('Product not found', 404);
  await prisma.product.delete({ where: { id: product.id } });
  // Other sizes may still use the same image; only remove it when the last one goes
  const stillUsed = product.imageId && await prisma.product.count({ where: { imageId: product.imageId } });
  if (!stillUsed) await deleteImage(product.imageId);
  return Response.json({ ok: true });
});
