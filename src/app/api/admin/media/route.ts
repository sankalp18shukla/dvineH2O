import { z } from 'zod';
import { getStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { audit } from '@/lib/audit';
import { deleteMedia, finalizeMedia, listMedia, MediaError, signMediaUpload } from '@/lib/media';
import { limitRequest, sameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Admin media library for promotions.
 *   GET                          list
 *   POST {action:'sign', …}      one-time signed upload URL (the browser uploads straight to Storage)
 *   POST {action:'finalize', …}  verify the uploaded bytes, then it appears in the library
 *   DELETE ?name=                remove
 */
async function staff() {
  const s = await getStaff();
  return s && can(s.role, 'content') ? s : null;
}
const deny = () => Response.json({ error: 'Not allowed' }, { status: 403 });
const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  if (!(await staff())) return deny();
  return Response.json({ files: await listMedia() }, { headers: noStore });
}

const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('sign'), name: z.string().max(200), size: z.number().int().positive(), type: z.string().max(60) }),
  z.object({ action: z.literal('finalize'), name: z.string().max(80) }),
]);

export async function POST(req: Request) {
  if (!sameOrigin(req)) return deny();
  const s = await staff();
  if (!s) return deny();
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
  try {
    if (p.data.action === 'sign') {
      if (!(await limitRequest('upload', `staff:${s.id}`))) return Response.json({ error: 'Too many uploads. Wait a little and try again.' }, { status: 429 });
      return Response.json(await signMediaUpload(p.data), { headers: noStore });
    }
    const file = await finalizeMedia(p.data.name);
    await audit(s.id, 'media.upload', 'media', file.name);
    return Response.json(file, { headers: noStore });
  } catch (e) {
    return Response.json({ error: e instanceof MediaError ? e.message : 'The upload failed.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return deny();
  const s = await staff();
  if (!s) return deny();
  const name = new URL(req.url).searchParams.get('name');
  if (!name) return Response.json({ error: 'Missing name' }, { status: 400 });
  await deleteMedia(name);
  await audit(s.id, 'media.delete', 'media', name);
  return Response.json({ ok: true });
}
