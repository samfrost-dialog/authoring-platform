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
  // In Next.js 16, serverComponentsExternalPackages moved to serverExternalPackages
  serverExternalPackages: ['jszip', 'node-html-parser'],
}

module.exports = nextConfig
