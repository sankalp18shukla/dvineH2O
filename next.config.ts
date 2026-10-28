import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', 'libsql', 'bcryptjs', 'nodemailer'],
  experimental: {
    serverActions: { bodySizeLimit: '12mb' }, // report uploads and review photos
  },
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      { source: '/models/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
