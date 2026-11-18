import 'server-only';
import { randomToken } from './numbering';
import { supabaseAdmin } from './supabase/admin';
import { publicFileUrl } from './supabase/config';

/**
 * Files sent with website forms, stored in Supabase Storage:
 *   private        → bucket `private` (water reports, enquiry photos, lab reports), served only via /api/admin/files
 *   public         → bucket `review-photos` (review photos, shown once a review is approved)
 * The real type is read from the file's first bytes; the browser's claimed type and file name are ignored.
 */
export const PRIVATE_BUCKET = 'private';
export const REVIEW_BUCKET = 'review-photos';

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': b => b.subarray(0, 5).toString('latin1') === '%PDF-',
  'image/png': b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};
const EXT: Record<string, string> = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

export class UploadError extends Error {}

/** A PDF that carries script or auto-run actions is refused (they have no place in a lab report). */
function riskyPdf(buf: Buffer) {
  const s = buf.toString('latin1');
  return /\/(JavaScript|JS|Launch|EmbeddedFile)\b/.test(s);
}

export async function saveUpload(file: File, opts: { allowed: string[]; maxMb: number; visibility: 'private' | 'public'; folder: string }) {
  if (!file || file.size === 0) throw new UploadError('Choose a file to upload.');
  if (file.size > opts.maxMb * 1024 * 1024) throw new UploadError(`Files must be ${opts.maxMb} MB or smaller.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = opts.allowed.find(m => SIGNATURES[m]?.(buf));
  if (!mime) throw new UploadError(`Upload a ${opts.allowed.map(m => EXT[m].slice(1).toUpperCase()).join(', ')} file.`);
  if (mime === 'application/pdf' && riskyPdf(buf)) throw new UploadError('This PDF contains scripts or embedded files. Please export it again as a plain PDF.');

  const folder = opts.folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'misc';
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${randomToken(12)}${EXT[mime]}`;
  const bucket = opts.visibility === 'private' ? PRIVATE_BUCKET : REVIEW_BUCKET;
  const { error } = await supabaseAdmin().storage.from(bucket).upload(path, buf, { contentType: mime, upsert: false, cacheControl: opts.visibility === 'public' ? '31536000' : '0' });
  if (error) {
    console.error('[uploads]', bucket, error.message);
    throw new UploadError('The upload failed. Please try again.');
  }
  // the original name is kept only as a label for staff (never used as a path)
  const fileName = file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || `upload${EXT[mime]}`;
  return { storedPath: path, publicUrl: opts.visibility === 'public' ? publicFileUrl(bucket, path) : null, mime, size: file.size, fileName };
}

/** Reads a private file (after the caller has checked who is asking). */
export async function readPrivate(path: string) {
  if (!path || path.includes('..') || path.startsWith('/')) return null;
  const { data, error } = await supabaseAdmin().storage.from(PRIVATE_BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
