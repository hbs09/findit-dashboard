import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Silencia o warning "multiple lockfiles detected" — fixa a root no projeto
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iogbyguazcrpooguggue.supabase.co",
      },
    ],
  },
};

export default nextConfig;
