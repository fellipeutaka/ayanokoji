import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { siteConfig } from "@/config/site";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  // biome-ignore lint/suspicious/useAwait: This needs to be async
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
  // biome-ignore lint/suspicious/useAwait: This is a Next.js API
  redirects: async () => {
    return [
      {
        destination: siteConfig.links.github,
        source: "/github",
        permanent: true,
      },
      {
        source: "/",
        destination: "/docs",
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
