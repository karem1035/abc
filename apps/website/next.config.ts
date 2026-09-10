import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // local RustFS/S3 media storage used by the dashboard uploads
      { protocol: 'http', hostname: 'localhost', port: '9000' },
    ],
  },
}

export default nextConfig
