import type { Metadata } from 'next';
import { SITE, SOCIAL } from './content';

/**
 * Search terms for the whole site, in one place.
 *
 * Nothing here is printed as hidden text on a page: Google treats invisible keyword text as spam and demotes
 * the whole site for it. These terms reach search engines the ways they accept:
 *  - `<meta name="keywords">` on every page (the root layout sets the site-wide list, `seo()` adds a page's own),
 *  - the brand's other spellings ("Divine H2O", "Divine water"…) as `alternateName` in the structured data
 *    that <SiteSchema /> puts on every public page, so a search for "divine water" finds DVINE H2O,
 *  - the page descriptions, which name the brand and say how it is pronounced.
 *
 * To change what a page targets, edit PAGE_KEYWORDS below. Keep each list to real phrases people type;
 * long lists of near-repeats read as keyword stuffing.
 */

/** How people actually type the brand: DVINE is said "divine", so most searches spell it that way. */
export const BRAND_NAMES = [
  'DVINE H2O', 'DVINE', 'Divine H2O', 'Divine', 'Divine water', 'DVINE water', 'Dvine H2O', 'DivineH2O', 'DVINEH2O',
  'Divine H2O India', 'Divine hydrogen water', 'Divine alkaline water',
];

/** On every page. Brand, product categories and the place the business serves from. */
export const SITE_KEYWORDS = [
  ...BRAND_NAMES,
  'hydrogen water', 'hydrogen water bottle', 'hydrogen water bottle India', 'alkaline water', 'alkaline water machine',
  'water ionizer India', 'functional hydration', 'healthy drinking water', 'home water system', 'water testing at home',
  'Bhubaneswar', 'Odisha', 'India',
];

/** Extra terms per page, keyed by path. Researched against Indian search listings, Nov 2026. */
export const PAGE_KEYWORDS: Record<string, string[]> = {
  '/': [
    'Divine H2O official site', 'hydrogen water bottle price in India', 'alkaline water ionizer for home',
    'best water ionizer India', 'hydrogen rich water', 'water purifier Bhubaneswar',
  ],
  '/hydrogen-bottles': [
    'Hyper hydrogen water bottle', 'Divine hydrogen water bottle', 'hydrogen water bottle price in India',
    'buy hydrogen water bottle online', 'hydrogen rich water bottle', 'portable hydrogen water generator',
    'SPE PEM hydrogen water bottle', 'rechargeable hydrogen water bottle', 'molecular hydrogen water', 'hydrogen water benefits',
  ],
  '/home-water-systems': [
    'Crystal home water system', 'Divine alkaline water machine', 'alkaline water machine for home',
    'alkaline water ionizer price in India', 'water ionizer for home', 'alkaline water purifier', 'ionized water machine',
    'hydrogen water machine for home', 'pH water machine', 'kitchen water ionizer',
  ],
  '/for-business': [
    'Titan 111', 'TitanForce 111', 'commercial water ionizer', 'alkaline water dispenser for office',
    'commercial hydrogen water machine', 'water system for gyms', 'water system for hotels', 'water system for hospitals',
    'corporate drinking water solution',
  ],
  '/water-testing': [
    'water testing at home', 'drinking water test', 'home water quality test', 'TDS test at home', 'water hardness test',
    'water testing Bhubaneswar', 'lab water test with home sample collection', 'arsenic and fluoride water test',
    'free water test', 'water pH test',
  ],
  '/blog': [
    'hydrogen water benefits', 'alkaline water benefits', 'is alkaline water good for you', 'hydrogen water research',
    'hydration tips', 'how much water to drink a day', 'what is hydrogen water',
  ],
  '/support': ['DVINE H2O customer care', 'Divine H2O support', 'water ionizer service', 'product warranty', 'user manual'],
  '/book-demo': ['alkaline water machine demo', 'water ionizer home demo', 'Crystal demo', 'Titan 111 demo'],
  '/about': ['about DVINE H2O', 'Divine H2O founder', 'Nandini Lakhotia', 'DVINE United Private Limited', 'water ionizer company Bhubaneswar', 'Odisha water startup'],
  '/become-a-partner': [
    'water purifier dealership', 'water ionizer distributor India', 'hydrogen water bottle distributor',
    'health product franchise India', 'Divine H2O dealer',
  ],
};

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const unique = (xs: string[]) => [...new Set(xs)];

/** The site-wide description: names the brand, says how it is pronounced, lists what it makes. */
export const SITE_DESCRIPTION =
  'DVINE H2O (said "divine") makes functional hydration systems in India: Crystal alkaline water system for the home, ' +
  'the Hyper hydrogen water bottle for the day, TitanForce 111 for shared spaces, and water testing at home.';

/**
 * A page's metadata with its keywords and canonical URL filled in. Use it on every indexable page:
 *   export const metadata = seo('/hydrogen-bottles', { title: 'Hyper hydrogen water bottle', description: '…' });
 * Anything passed in wins over what this adds.
 */
export function seo(path: string, meta: Metadata = {}, extra: string[] = []): Metadata {
  return {
    keywords: unique([...(PAGE_KEYWORDS[path] ?? []), ...extra, ...SITE_KEYWORDS]),
    alternates: { canonical: path },
    ...meta,
  };
}

/** Structured data on every public page: who DVINE H2O is, every spelling of the name, and site search. */
export function siteSchema() {
  const url = site();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${url}/#org`, name: SITE.name, alternateName: BRAND_NAMES.filter(n => n !== SITE.name),
        legalName: SITE.legalName, taxID: SITE.gstin, foundingDate: '2024-02-23', founder: { '@type': 'Person', name: 'Nandini Lakhotia', jobTitle: 'Founder', image: `${url}/images/founder/nandini-portrait-34.webp` }, url, logo: `${url}/brand/logo.svg`, description: SITE_DESCRIPTION, slogan: SITE.tagline, email: SITE.email,
        sameAs: SOCIAL.map(s => s.href),
        contactPoint: [{ '@type': 'ContactPoint', telephone: SITE.phone, email: SITE.careEmail, contactType: 'customer service', areaServed: 'IN', availableLanguage: ['en', 'hi', 'or'] }],
        knowsAbout: ['Hydrogen water', 'Alkaline water', 'Water ionizers', 'Drinking water quality', 'Water testing', 'Hydration'],
      },
      {
        '@type': 'Store', '@id': `${url}/#store`, name: SITE.name, alternateName: 'Divine H2O', url, image: `${url}/images/collection.webp`,
        telephone: SITE.phone, email: SITE.email, parentOrganization: { '@id': `${url}/#org` }, areaServed: { '@type': 'State', name: 'Odisha' },
        address: { '@type': 'PostalAddress', streetAddress: 'Office No. 5, 1st Floor, Block 1, Bhawani Mall, Saheed Nagar', addressLocality: 'Bhubaneswar', addressRegion: 'Odisha', postalCode: '751007', addressCountry: 'IN' },
        hasMap: SITE.mapsUrl,
      },
      {
        '@type': 'WebSite', '@id': `${url}/#site`, name: SITE.name, alternateName: ['Divine H2O', 'DVINE'], url, inLanguage: 'en-IN',
        publisher: { '@id': `${url}/#org` },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${url}/search?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
      },
    ],
  };
}
