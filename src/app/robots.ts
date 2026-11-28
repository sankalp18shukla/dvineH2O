import type { MetadataRoute } from 'next';
import { testPaymentsAllowed } from '@/lib/payments-mode';

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Lets search engines into the shop and blog; keeps them out of accounts, checkout, orders and the admin. */
export default function robots(): MetadataRoute.Robots {
  // a demo or staging deploy (test payments on) stays out of search results, so it never competes with the live
  // domain and strangers can't find a shop that takes pretend payments; it opens up by itself once real payments are on
  if (testPaymentsAllowed()) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/api/', '/cart', '/checkout', '/order/', '/invoice/', '/search', '/water-testing/booking/', '/water-testing/review/', '/r/', '/offer/', '/auth/'] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
