import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
        pathname: "/files/**",
      },
    ],
  },
  async redirects() {
    return [
      // Wix URLs that must keep their link equity after the migration.
      { source: "/general-1", destination: "/menu", permanent: true },
      // The Wix Bookings page only ever rendered "Nothing to book right now".
      { source: "/book-online", destination: "/book-a-table", permanent: true },
    ];
  },
};

export default nextConfig;
