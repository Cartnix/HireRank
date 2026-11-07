import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

if (process.env.NEXT_PUBLIC_API_URL === "/" && !apiProxyTarget) {
  throw new Error("API_PROXY_TARGET is required when NEXT_PUBLIC_API_URL is /");
}

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactStrictMode: false,
  async rewrites() {
    if (!apiProxyTarget) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
