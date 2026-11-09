import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomToken } from './numbering';

/**
 * Public media for promotions (hero slides, promo cards, ribbon, partner page), uploaded from the admin.
 * Stored in data/media and served by /media/[name] (files added to public/ after a build are not served).
 * On a read-only host (Vercel), paste a hosted URL in the editor instead, or point this at S3/R2.
 */
export const MEDIA_DIR = path.join(process.cwd(), 'data', 'media');

type Kind = { mime: string; ext: string; type: 'image' | 'video'; test: (b: Buffer) => boolean };
const KINDS: Kind[] = [
  { mime: 'image/png', ext: '.png', type: 'image', test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', ext: '.jpg', type: 'image', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/webp', ext: '.webp', type: 'image', test: b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { mime: 'image/gif', ext: '.gif', type: 'image', test: b => b.subarray(0, 4).toString() === 'GIF8' },
  { mime: 'image/avif', ext: '.avif', type: 'image', test: b => b.subarray(4, 8).toString() === 'ftyp' && /avi[fs]/.test(b.subarray(8, 12).toString()) },
  { mime: 'video/webm', ext: '.webm', type: 'video', test: b => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { mime: 'video/quicktime', ext: '.mov', type: 'video', test: b => b.subarray(4, 8).toString() === 'ftyp' && b.subarray(8, 10).toString() === 'qt' },
  { mime: 'video/mp4', ext: '.mp4', type: 'video', test: b => b.subarray(4, 8).toString() === 'ftyp' },
];
export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(KINDS.map(k => [k.ext, k.mime]));
export const MAX_MB = { image: 15, video: 150 } as const;

export class MediaError extends Error {}

export async function saveMedia(file: File) {
  if (!file || file.size === 0) throw new MediaError('Choose a file to upload.');
  const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
  const kind = KINDS.find(k => k.test(head));
  if (!kind) throw new MediaError('Upload a JPG, PNG, WebP, GIF or AVIF image, or an MP4, MOV or WebM video.');
  if (file.size > MAX_MB[kind.type] * 1024 * 1024) throw new MediaError(`${kind.type === 'video' ? 'Videos' : 'Images'} must be ${MAX_MB[kind.type]} MB or smaller.`);
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'media';
  const name = `${base}-${randomToken(6).toLowerCase()}${kind.ext}`;
  await fs.writeFile(path.join(MEDIA_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { src: `/media/${name}`, type: kind.type, name, size: file.size };
}

export async function listMedia() {
  const names = await fs.readdir(MEDIA_DIR).catch(() => [] as string[]);
  const rows = await Promise.all(names.filter(n => MIME_BY_EXT[path.extname(n)]).map(async n => {
    const st = await fs.stat(path.join(MEDIA_DIR, n));
    return { src: `/media/${n}`, name: n, size: st.size, at: st.mtimeMs, type: MIME_BY_EXT[path.extname(n)].startsWith('video') ? 'video' as const : 'image' as const };
  }));
  return rows.sort((a, b) => b.at - a.at);
}

export async function deleteMedia(name: string) {
  const full = path.join(MEDIA_DIR, path.basename(name));
  await fs.unlink(full).catch(() => {});
}

/** Resolves a /media/ file name safely inside MEDIA_DIR. */
export const mediaPath = (name: string) => {
  const full = path.join(MEDIA_DIR, path.basename(name));
  return full.startsWith(MEDIA_DIR + path.sep) ? full : null;
};
