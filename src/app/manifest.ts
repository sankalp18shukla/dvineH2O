import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

/** Name and icons used when someone adds the site to their phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'browser',
    background_color: '#F4F7FD',
    theme_color: '#06195A',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/brand/icon-192.png', type: 'image/png', sizes: '192x192' },
      { src: '/brand/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
  };
}
