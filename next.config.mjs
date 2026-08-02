/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Make sure the Prisma client (loaded via dynamic require) is included
  // in the standalone output. Without this, `node server.js` on the VPS
  // would fail with "Cannot find module '.prisma/client/default'".
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/**", "./node_modules/@prisma/**"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;