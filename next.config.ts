import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts', 'date-fns'],
  },
  // Cache más agresivo para faster HMR
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hora
    pagesBufferLength: 10,
  },
};

export default nextConfig;
