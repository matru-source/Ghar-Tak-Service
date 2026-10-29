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
      {
        source: '/customer',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/customer/:path*',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/tech',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/tech/:path*',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
