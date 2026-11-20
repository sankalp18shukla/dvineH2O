import fs from 'node:fs/promises';
import path from 'node:path';
import { requireStaff } from '@/lib/auth';
import { getEditorContent } from '@/lib/site-content.server';
import { ContentEditor } from '@/components/admin/content/ContentEditor';

export const metadata = { title: 'Homepage & promotions' };

/** The site's own photos, offered in the media library next to the uploads. */
async function siteImages() {
  const dir = path.join(process.cwd(), 'public', 'images');
  // product photos live in folders (images/hyper, images/crystal); the bottle's assembly parts are not photos
  const names = await fs.readdir(dir, { recursive: true }).catch(() => [] as string[]);
  return names.map(n => n.split(path.sep).join('/')).filter(n => /\.(png|jpe?g|webp|avif)$/i.test(n) && !n.includes('/parts/'))
    .map(n => `/images/${n}`);
}

export default async function ContentPage() {
  await requireStaff('content');
  const [c, images] = await Promise.all([getEditorContent(), siteImages()]);
  return <ContentEditor live={c.live} draft={c.draft} hasDraft={c.hasDraft} siteImages={images} />;
}
