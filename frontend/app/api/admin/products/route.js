import { prisma } from '@/lib/server/db';
import { uploadBuffer } from '@/lib/server/objectStorage';
import { adminOnly, fail } from '@/lib/server/http';
import { readForm, readImage, fileBuffer } from '@/lib/server/image';

export const GET = adminOnly(async () => Response.json(await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })));

export const POST = adminOnly(async (req) => {
  const form = await readForm(req);
  const file = readImage(form);
  const name = String(form.get('name') || '').trim();
  const description = String(form.get('description') || '').trim();
  let variants;
  try { variants = JSON.parse(form.get('variants') || '[]'); } catch { variants = null; }
  if (!Array.isArray(variants) || variants.length === 0 || variants.length > 10) {
    return fail('Add between 1 and 10 quantities');
  }
  variants = variants.map((v) => ({ packSize: String(v?.packSize ?? '').trim(), price: Number(v?.price) }));
  if (!name || variants.some((v) => !v.packSize)) return fail('Name and pack size are required');
  if (variants.some((v) => !Number.isInteger(v.price) || v.price <= 0)) return fail('Price must be a positive whole number');
  if (!file) return fail('Image is required');

  // One image shared by every size row
  const img = await uploadBuffer(await fileBuffer(file), file.type);
  const { count } = await prisma.product.createMany({
    data: variants.map((v) => ({ name, description, ...v, imageUrl: img.url, imageId: img.key })),
  });
  return Response.json({ count }, { status: 201 });
});
