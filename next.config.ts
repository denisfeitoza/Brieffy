import type { NextConfig } from "next";

// HSTS rules of thumb (after seeing mobile clients hit "site não é seguro"):
//   - `preload` should be set ONLY after the domain is actually submitted to
//     hstspreload.org and accepted. Setting it eagerly bricks any subdomain
//     that lacks a valid cert (staging, legacy redirects) because preload-
//     listed browsers refuse the connection with no override.
//   - `includeSubDomains` is fine as long as every subdomain serves HTTPS.
//   - HSTS makes no sense over HTTP, so we only emit it in production.
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=()",
  },
  ...(isProd
    ? [{
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      }]
    : []),
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
