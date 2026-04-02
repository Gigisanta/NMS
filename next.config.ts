import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: '/Users/prueba/Desktop/NMS',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'framer-motion'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
}

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withSentryConfig(withBundleAnalyzerConfig(nextConfig), {
  silent: true,
})
