import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV !== 'production';
const supabaseOrigin = (() => { try { return new URL(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin; } catch { return ''; } })();
const supabase = [supabaseOrigin, 'https://*.supabase.co'].filter(Boolean).join(' ');
// Google Analytics / Meta Pixel (src/components/seo/Analytics.tsx): their domains are allowed only once an ID is set
const ga = process.env.NEXT_PUBLIC_GA_ID ? { script: ' https://www.googletagmanager.com', connect: ' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com' } : { script: '', connect: '' };
const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID ? { script: ' https://connect.facebook.net', connect: ' https://www.facebook.com https://connect.facebook.net' } : { script: '', connect: '' };

/**
 * Content-Security-Policy. Next.js injects inline bootstrap scripts, so script-src keeps 'unsafe-inline'
 * (a nonce-based policy would force every page to render dynamically); everything else is locked down:
 * no plugins, no foreign frames or framing, no base-tag hijack, form posts only to us and the gateways,
 * network calls only to us, Supabase Storage (admin uploads) and Razorpay (blob:/data: are the 3D models' own textures).
 * 'wasm-unsafe-eval' lets the meshopt decoder for the 3D models compile its WebAssembly.
 * Images and video may come from any https host, because the promotions editor accepts hosted links.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com${ga.script}${pixel.script}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' blob: data: ${supabase} https://*.razorpay.com${ga.connect}${pixel.connect}${dev ? ' ws: http://localhost:*' : ''}`,
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.razorpay.com https://*.phonepe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const nextConfig: NextConfig = {
  serverExternalPackages: ['nodemailer', 'postgres'],
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: '12mb' }, // report uploads and review photos
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // no 3840 px variant (brief: the home page asked for every image at 3840 px wide); 2048 covers a 1024 px slot at 2x
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
  // The home page checks public/ for product cutouts and section photos at request time.
  outputFileTracingIncludes: { '/': ['./public/images/*_product.png', './public/images/*_sec.png'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
        ],
      },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      // cached for a year without revalidating: a changed model MUST get a new file name (name.<hash>.glb),
      // or browsers keep showing the old one
      { source: '/models/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
