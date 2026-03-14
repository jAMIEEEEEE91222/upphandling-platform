import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["puppeteer"],
  env: {
    PUPPETEER_CACHE_DIR: "/tmp/puppeteer"
  }
};

export default nextConfig;
