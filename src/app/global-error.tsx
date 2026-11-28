'use client';

import { SITE } from '@/lib/content';

/**
 * Last-resort page when the root layout itself fails. It replaces the whole document, so it carries its own
 * <html> and plain inline styles (the site's CSS and fonts may not have loaded).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const btn = { padding: '12px 22px', borderRadius: 999, font: '600 15px system-ui, sans-serif', cursor: 'pointer', textDecoration: 'none' } as const;
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F4F7FD', color: '#06195A', font: '16px/1.5 system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <main>
          <p style={{ letterSpacing: '.2em', fontWeight: 700, fontSize: 13 }}>{SITE.name}</p>
          <h1 style={{ fontSize: 34, margin: '12px 0' }}>Something went wrong.</h1>
          <p style={{ maxWidth: 440, margin: '0 auto 24px' }}>The site didn’t load properly. Please try again, or call {SITE.phone}.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={reset} style={{ ...btn, border: 0, background: '#306CE4', color: '#fff' }}>Try again</button>
            <a href="/" style={{ ...btn, border: '1.5px solid #06195A', color: '#06195A' }}>Go home</a>
          </div>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, opacity: .6 }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
