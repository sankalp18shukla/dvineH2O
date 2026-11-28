import type { MetadataRoute } from 'next';
import { POLICIES } from '@/lib/content';
import { getPublishedPosts } from '@/lib/blog.server';

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Rebuilt hourly so newly published blog posts reach search engines without a deploy. */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];
const page = (path: string, priority: number, changeFrequency: Entry['changeFrequency'] = 'weekly', lastModified?: Date): Entry =>
  ({ url: site + path, priority, changeFrequency, ...(lastModified ? { lastModified } : {}) });

/** Every public page: shop, product pages, services, blog posts, support guides and policies. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await getPublishedPosts()).filter(p => !p.externalUrl);
  return [
    page('/', 1, 'daily'),
    page('/hydrogen-bottles', 0.9),
    page('/home-water-systems', 0.9),
    page('/home-water-systems/specifications', 0.6),
    page('/home-water-systems/test-results', 0.6),
    page('/for-business', 0.8),
    page('/water-testing', 0.8),
    page('/book-demo', 0.6, 'monthly'),
    page('/blog', 0.7, 'daily'),
    ...posts.map(p => page(`/blog/${p.slug}`, 0.6, 'monthly', p.updatedAt ?? p.publishedAt ?? undefined)),
    page('/support', 0.5, 'monthly'),
    ...['crystal', 'hyper', 'titan'].map(k => page(`/support/${k}`, 0.4, 'monthly')),
    page('/about', 0.6, 'monthly'),
    page('/become-a-partner', 0.5, 'monthly'),
    page('/track', 0.3, 'yearly'),
    page('/warranty', 0.3, 'yearly'),
    ...Object.keys(POLICIES).map(k => page(`/policies/${k}`, 0.2, 'yearly')),
  ];
}
