import { requireStaff } from '@/lib/auth';
import { CATEGORY_KEYS, type Category, type PostProduct } from '@/lib/blog';
import { PostEditor } from '@/components/admin/PostEditor';
import { BLANK, siteImages } from '../shared';

export const metadata = { title: 'New post' };

export default async function NewPost({ searchParams }: { searchParams: Promise<{ category?: string; product?: string; link?: string }> }) {
  await requireStaff('content');
  const sp = await searchParams;
  const category = (CATEGORY_KEYS as string[]).includes(sp.category ?? '') ? (sp.category as Category) : BLANK.category;
  const product = ['crystal', 'hyper', 'titan'].includes(sp.product ?? '') ? (sp.product as PostProduct) : null;
  return <PostEditor initial={{ ...BLANK, category, product, external: sp.link === '1' }} siteImages={await siteImages()} />;
}
