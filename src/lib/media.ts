import 'server-only';
import { randomToken } from './numbering';
import { supabaseAdmin } from './supabase/admin';
import { publicFileUrl, supabaseUrl } from './supabase/config';

/**
 * Public media for promotions (hero slides, promo cards, ribbon, partner page), uploaded from the admin into
 * the public Supabase Storage bucket `media` and served from Supabase's CDN.
 *
 * Upload flow (keeps large videos off our serverless functions):
 *   1. staff asks to upload  → server checks role, declared type and size, issues a one-time signed upload URL
 *   2. the browser PUTs the file straight to Storage (the bucket also enforces size and MIME type)
 *   3. server reads the first bytes back and deletes the file unless they match a real image / video signature
 */
export const MEDIA_BUCKET = 'media';

type Kind = { mime: string; ext: string; type: 'image' | 'video'; test: (b: Buffer) => boolean };
const KINDS: Kind[] = [
  { mime: 'image/png', ext: '.png', type: 'image', test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', ext: '.jpg', type: 'image', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/webp', ext: '.webp', type: 'image', test: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'image/gif', ext: '.gif', type: 'image', test: b => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  { mime: 'image/avif', ext: '.avif', type: 'image', test: b => b.subarray(4, 8).toString('latin1') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 12).toString('latin1')) },
  { mime: 'video/webm', ext: '.webm', type: 'video', test: b => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { mime: 'video/quicktime', ext: '.mov', type: 'video', test: b => b.subarray(4, 8).toString('latin1') === 'ftyp' && b.subarray(8, 10).toString('latin1') === 'qt' },
  { mime: 'video/mp4', ext: '.mp4', type: 'video', test: b => b.subarray(4, 8).toString('latin1') === 'ftyp' },
];
export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(KINDS.map(k => [k.ext, k.mime]));
export const MAX_MB = { image: 15, video: 150 } as const;
const NAME = /^[a-z0-9-]{1,60}\.(png|jpg|webp|gif|avif|webm|mov|mp4)$/;

export class MediaError extends Error {}

export type MediaFile = { src: string; name: string; type: 'image' | 'video'; size?: number; at?: number };
const typeOf = (name: string): 'image' | 'video' => (/\.(mp4|webm|mov)$/.test(name) ? 'video' : 'image');

/** Step 1: validate what the browser says it will send and issue a one-time signed upload URL. */
export async function signMediaUpload(input: { name: string; size: number; type: string }) {
  const kind = KINDS.find(k => k.mime === input.type);
  if (!kind) throw new MediaError('Upload a JPG, PNG, WebP, GIF or AVIF image, or an MP4, MOV or WebM video.');
  if (!(input.size > 0) || input.size > MAX_MB[kind.type] * 1024 * 1024) throw new MediaError(`${kind.type === 'video' ? 'Videos' : 'Images'} must be ${MAX_MB[kind.type]} MB or smaller.`);
  const base = String(input.name).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'media';
  const name = `${base}-${randomToken(6).toLowerCase().replace(/[^a-z0-9]/g, 'x')}${kind.ext}`;
  const { data, error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).createSignedUploadUrl(name);
  if (error || !data) throw new MediaError('Could not start the upload. Try again.');
  return { name, uploadUrl: data.signedUrl, contentType: kind.mime };
}

/** Step 3: check the uploaded bytes really are what they claim; remove the file if not. */
export async function finalizeMedia(name: string): Promise<MediaFile> {
  if (!NAME.test(name)) throw new MediaError('Unknown file.');
  const r = await fetch(publicFileUrl(MEDIA_BUCKET, name), { headers: { Range: 'bytes=0-31' }, cache: 'no-store' }).catch(() => null);
  const head = r && r.ok ? Buffer.from(await r.arrayBuffer()).subarray(0, 32) : Buffer.alloc(0);
  const expected = MIME_BY_EXT[name.slice(name.lastIndexOf('.'))];
  const kind = KINDS.find(k => k.test(head));
  if (!kind || kind.mime !== expected) {
    await deleteMedia(name);
    throw new MediaError('That file isn’t a valid image or video, so it was removed.');
  }
  return { src: publicFileUrl(MEDIA_BUCKET, name), name, type: kind.type };
}

export async function listMedia(): Promise<MediaFile[]> {
  const { data, error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
  if (error || !data) return [];
  return data.filter(f => NAME.test(f.name)).map(f => ({
    src: publicFileUrl(MEDIA_BUCKET, f.name), name: f.name, type: typeOf(f.name),
    size: (f.metadata as { size?: number } | null)?.size, at: f.created_at ? Date.parse(f.created_at) : undefined,
  }));
}

export async function deleteMedia(name: string) {
  if (!NAME.test(name)) return;
  await supabaseAdmin().storage.from(MEDIA_BUCKET).remove([name]);
}

/** Storage origin, for the Content-Security-Policy and next/image. */
export const storageOrigin = () => { try { return new URL(supabaseUrl()).origin; } catch { return ''; } };
