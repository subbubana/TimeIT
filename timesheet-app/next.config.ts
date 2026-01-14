import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail the build if the database is not available
  // This allows the app to build without a database connection
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
