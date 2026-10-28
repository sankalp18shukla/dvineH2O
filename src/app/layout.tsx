import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SITE } from '@/lib/content';
import { ButtonRoll } from '@/components/ui/ButtonRoll';
import './globals.css';

// Self-hosted stand-ins (OFL) for the brand fonts. When DVINE supplies the licensed Apple Garamond and
// DX Figgle files, drop them in src/fonts and point these two declarations at them.
const bricolage = localFont({ src: '../fonts/bricolage-latin-wght.woff2', weight: '200 800', variable: '--font-bricolage', display: 'swap' });
const garamond = localFont({
  src: [
    { path: '../fonts/garamond-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/garamond-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/garamond-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/garamond-500-italic.woff2', weight: '500', style: 'italic' },
  ],
  variable: '--font-garamond', display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_IN', images: ['/images/collection.webp'] },
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#06195A', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${bricolage.variable} ${garamond.variable}`} suppressHydrationWarning>
      <head>
        {/* enables reveal-on-scroll only when JS runs, so content is never hidden without it */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}<ButtonRoll /></body>
    </html>
  );
}
