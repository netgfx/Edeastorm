import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    // Disable preloading entries to reduce memory usage
    preloadEntriesOnStart: false,
  },
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qxlpjyccgyhxmewlitxh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
