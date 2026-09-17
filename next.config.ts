import dotenv from "dotenv";
import type { NextConfig } from "next";

const getEnvFile = () => {
  const env = process.env.BUILD_ENV?.trim()?.toLowerCase();

  switch (env) {
    case "development":
      return ".env.development";
    case "uat":
      return ".env.uat";
    case "pilot":
      return ".env.pilot";
    case "production":
      return ".env.production";
    default:
      return ".env.development";
  }
};

dotenv.config({ path: getEnvFile(), override: true });

const nextConfig: NextConfig = {
  assetPrefix: !!process.env.ASSET_PREFIX?.length
    ? process.env.ASSET_PREFIX
    : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  trailingSlash: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: ["production", "pilot", "uat"].includes(
      process.env.BUILD_ENV?.trim()?.toLowerCase() || "",
    ),
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "prd.motilaloswal.com",
        "web.motilaloswaluat.com",
        "localhost",
      ],
    },
  },
};

export default nextConfig;
