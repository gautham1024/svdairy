import { prisma } from '@/lib/server/db';
import { adminOnly, fail, readJson } from '@/lib/server/http';

export const PUT = adminOnly(async (req) => {
  const body = await readJson(req);
  const clean = (v) => String(v ?? '').trim().slice(0, 300);
  const data = {
    whatsappNumber: clean(body.whatsappNumber).replace(/\D/g, ''), // digits only
    phone: clean(body.phone),
    address: clean(body.address),
    facebookUrl: clean(body.facebookUrl),
    instagramUrl: clean(body.instagramUrl),
    youtubeUrl: clean(body.youtubeUrl),
    fssaiNumber: clean(body.fssaiNumber),
    hours: clean(body.hours),
    maxCartQty: Number(body.maxCartQty),
  };
  if (!Number.isInteger(data.maxCartQty) || data.maxCartQty < 1 || data.maxCartQty > 99) {
    return fail('Max quantity must be a whole number from 1 to 99');
  }
  return Response.json(await prisma.settings.update({ where: { id: 1 }, data }));
});
