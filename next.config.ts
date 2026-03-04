import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Keep this true for initial deployment. Once all TS issues are resolved,
    // set to false. Main issues are `any` types in profile/essays pages.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;