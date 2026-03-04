import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
  // Experimental features for better chunk loading
  experimental: {
    // Optimize package imports to reduce chunk size
    optimizePackageImports: ['@xyflow/react', 'framer-motion', 'gsap', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Transpile packages that might have issues with Turbopack
  transpilePackages: [],
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // Allow any Cloudflare R2 subdomain
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
      },
      // Allow Cloudflare R2 public bucket domains (*.r2.dev)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
