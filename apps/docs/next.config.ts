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
        destination: "/llms.mdx/docs/:path*",
        source: "/docs/:path*.mdx",
      },
    ];
  },
  // oxlint-disable-next-line typescript/require-await
  redirects: async () => [
    {
      destination: siteConfig.links.github,
      permanent: true,
      source: "/github",
    },
    {
      destination: "/docs",
      permanent: true,
      source: "/",
    },
  ],
};

export default withMDX(config);
