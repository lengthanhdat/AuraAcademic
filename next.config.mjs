import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Static Export for S3 + CloudFront hosting ──────────────────
  output: 'export',
  trailingSlash: true,   // /login → /login/index.html (S3 compatible)

  // Enable gzip/brotli compression
  compress: true,

  // Tree-shake heavy icon/component libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner', '@stomp/stompjs', 'recharts', 'date-fns', 'katex'],
  },

  // S3 không chạy được Next.js image optimization → dùng <img> thuần
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
