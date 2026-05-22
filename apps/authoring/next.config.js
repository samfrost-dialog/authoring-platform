/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@authoring/block-schema', '@authoring/scorm-runtime'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_DOMAIN?.replace('https://', '') || 'media.yourdomain.com',
      },
    ],
  },
  serverExternalPackages: ['jszip', 'node-html-parser'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    return [
      {
        source: '/api/import/:path*',
        headers: [
          { key: 'x-vercel-body-size-limit', value: '52428800' }, // 50MB
        ],
      },
    ]
  },
}

module.exports = nextConfig