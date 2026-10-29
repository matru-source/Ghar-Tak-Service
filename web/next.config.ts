import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/partner-app',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/partner-app/:path*',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/partner',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/partner/:path*',
        destination: '/admin',
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
    ];
  },
};

export default nextConfig;
