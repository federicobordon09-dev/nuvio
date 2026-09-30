import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mupdf"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;