import type { Product } from './catalog';
const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function productJsonLd(p: Product, path: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, brand: { '@type': 'Brand', name: 'DVINE H2O' },
    description: p.description, image: (p.images ?? []).map(i => site() + i), url: site() + path,
    ...(p.saleMode === 'cart' && p.price ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price: (p.price / 100).toFixed(2), availability: p.available > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: site() + path } } : {}),
    ...(p.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.toFixed(1), reviewCount: p.reviewCount } } : {}),
  };
}
