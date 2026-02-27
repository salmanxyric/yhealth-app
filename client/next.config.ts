import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Experimental features for better chunk loading
  experimental: {
    // Optimize package imports to reduce chunk size
    optimizePackageImports: ['@xyflow/react', 'framer-motion', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
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
    ],
  },
};

export default nextConfig;
