import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
