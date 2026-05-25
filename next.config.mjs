import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable gzip/brotli compression
  compress: true,

  // Tree-shake heavy icon/component libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner', '@stomp/stompjs'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withNextIntl(nextConfig);
