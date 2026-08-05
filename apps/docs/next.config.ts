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
  // oxlint-disable-next-line typescript/require-await
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
  // oxlint-disable-next-line typescript/require-await
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
