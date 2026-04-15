import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Dev: shared/ is at ../shared (monorepo root)
// Docker build: shared/ is copied to ./shared (inside client dir)
const sharedInside = path.join(__dirname, 'shared');
const sharedOutside = path.join(__dirname, '..', 'shared');
const sharedPath = fs.existsSync(sharedInside) ? sharedInside : sharedOutside;
const turbopackRoot = fs.existsSync(sharedInside) ? __dirname : path.join(__dirname, '..');

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
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.lordicon.com https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https: http:",
              "connect-src 'self' http://localhost:* ws://localhost:* https: wss:",
              "frame-src 'self' https://accounts.google.com https://accounts.spotify.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // Disable dev indicators (floating toolbar icons)
  devIndicators: false,
  // Experimental features for better chunk loading
  experimental: {
    // Optimize package imports to reduce chunk size
    optimizePackageImports: ['@xyflow/react', 'framer-motion', 'gsap', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Turbopack config: resolves @shared in both dev (outside) and Docker (inside client)
  turbopack: {
    root: turbopackRoot,
    resolveAlias: {
      '@shared': sharedPath,
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.mjs'],
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
      {
        protocol: 'https',
        hostname: 'media.tenor.com',
      },
      {
        protocol: 'https',
        hostname: '*.tenor.com',
      },
    ],
  },
};

export default nextConfig;
