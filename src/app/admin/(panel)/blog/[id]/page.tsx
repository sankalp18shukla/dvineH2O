import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { adminGetPost } from '@/lib/blog.server';
import { PostEditor } from '@/components/admin/PostEditor';
import { siteImages, toDraft } from '../shared';

export const metadata = { title: 'Edit post' };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('content');
  const id = Number((await params).id);
  const p = Number.isInteger(id) && id > 0 ? await adminGetPost(id) : null;
  if (!p) notFound();
  // keyed by the saved version, so the editor starts fresh after a save or when another post is opened
  return <PostEditor key={`${p.id}-${p.updatedAt.getTime()}`} initial={toDraft(p)} siteImages={await siteImages()} />;
}
