import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/partner-app',
        destination: '/partner',
        permanent: false,
      },
      {
        source: '/partner-app/:path*',
        destination: '/partner',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
