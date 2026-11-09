import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { mediaPath, MIME_BY_EXT } from '@/lib/media';

/** Promotion media uploaded in the admin. Supports byte ranges, so videos stream and seek (Safari requires it). */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const full = mediaPath(name);
  const mime = MIME_BY_EXT[path.extname(name).toLowerCase()];
  const st = full && mime ? await fs.promises.stat(full).catch(() => null) : null;
  if (!full || !mime || !st?.isFile()) return new Response('Not found', { status: 404 });
  const base = { 'Content-Type': mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable' };
  const range = req.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
    start = Math.max(0, start); end = Math.min(end, st.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${st.size}` } });
    const body = Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': String(end - start + 1) } });
  }
  const body = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new Response(body, { headers: { ...base, 'Content-Length': String(st.size) } });
}
