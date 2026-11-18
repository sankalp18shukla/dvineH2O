import { jsonLd } from '@/lib/seo';
import { siteSchema } from '@/lib/seo-keywords';

/** Organization, store and website structured data, with every spelling of the brand. Mounted once, in the store layout. */
export function SiteSchema() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteSchema()) }} />;
}
