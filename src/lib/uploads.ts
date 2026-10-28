import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomToken } from './numbering';

/** Private uploads (water reports) live outside /public and are served only to staff. Swap for S3/R2 in production. */
export const PRIVATE_DIR = path.join(process.cwd(), 'data', 'uploads');
export const PUBLIC_DIR = path.join(process.cwd(), 'public', 'uploads');

const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': b => b.subarray(0, 4).toString() === '%PDF',
  'image/png': b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
};
const EXT: Record<string, string> = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

export class UploadError extends Error {}

export async function saveUpload(file: File, opts: { allowed: string[]; maxMb: number; visibility: 'private' | 'public'; folder: string }) {
  if (!file || file.size === 0) throw new UploadError('Choose a file to upload.');
  if (file.size > opts.maxMb * 1024 * 1024) throw new UploadError(`Files must be ${opts.maxMb} MB or smaller.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = opts.allowed.find(m => SIGNATURES[m]?.(buf));
  if (!mime) throw new UploadError(`Upload a ${opts.allowed.map(m => EXT[m].slice(1).toUpperCase()).join(', ')} file.`);
  const dir = path.join(opts.visibility === 'private' ? PRIVATE_DIR : PUBLIC_DIR, opts.folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomToken(9)}${EXT[mime]}`;
  await fs.writeFile(path.join(dir, name), buf);
  return { storedPath: `${opts.folder}/${name}`, publicUrl: opts.visibility === 'public' ? `/uploads/${opts.folder}/${name}` : null, mime, size: file.size, fileName: file.name.slice(0, 120) };
}
