import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vnjbtflgemwvjrcrvuse.supabase.co",
      },
    ],
  },
};

export default nextConfig;
