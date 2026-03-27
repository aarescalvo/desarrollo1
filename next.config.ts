import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable turbopack to reduce memory usage
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    // Disable features that may cause issues
    optimizePackageImports: ['lucide-react'],
  },
  // Reduce compilation overhead
  swcMinify: true,
};

export default nextConfig;
