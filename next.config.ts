import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "gsap", "xlsx", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
