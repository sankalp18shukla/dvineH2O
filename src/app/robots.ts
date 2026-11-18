import type { MetadataRoute } from 'next';

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Lets search engines into the shop and blog; keeps them out of accounts, checkout, orders and the admin. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/api/', '/cart', '/checkout', '/order/', '/invoice/', '/search', '/water-testing/booking/', '/auth/'] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
