import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // local RustFS/S3 media storage used by the dashboard uploads
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      // production RustFS media storage (dashboard image uploads)
      { protocol: 'https', hostname: 'abc-files.karem.live' },
    ],
  },
}

export default nextConfig
