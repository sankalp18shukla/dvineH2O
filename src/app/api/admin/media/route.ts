import { getStaff } from '@/lib/auth';
import { can } from '@/lib/session';
import { audit } from '@/lib/audit';
import { deleteMedia, listMedia, MediaError, saveMedia } from '@/lib/media';

/** Admin media library for promotions: list, upload (multipart "file") and delete (?name=). */
async function staff() {
  const s = await getStaff();
  return s && can(s.role, 'content') ? s : null;
}

export async function GET() {
  if (!(await staff())) return Response.json({ error: 'Not allowed' }, { status: 403 });
  return Response.json({ files: await listMedia() });
}

export async function POST(req: Request) {
  const s = await staff();
  if (!s) return Response.json({ error: 'Not allowed' }, { status: 403 });
  const file = (await req.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Choose a file to upload.' }, { status: 400 });
  try {
    const saved = await saveMedia(file);
    await audit(s.id, 'media.upload', 'media', saved.name, { size: saved.size });
    return Response.json(saved);
  } catch (e) {
    return Response.json({ error: e instanceof MediaError ? e.message : 'The upload failed. On a read-only host, paste a hosted URL instead.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const s = await staff();
  if (!s) return Response.json({ error: 'Not allowed' }, { status: 403 });
  const name = new URL(req.url).searchParams.get('name');
  if (!name) return Response.json({ error: 'Missing name' }, { status: 400 });
  await deleteMedia(name);
  await audit(s.id, 'media.delete', 'media', name);
  return Response.json({ ok: true });
}
