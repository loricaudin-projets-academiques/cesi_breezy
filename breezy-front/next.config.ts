import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nécessaire pour que Next.js soit accessible depuis Docker
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
