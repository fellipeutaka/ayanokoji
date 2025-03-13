import { Icons } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customize layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Icons.Logo data-active="true" className="size-5" />
        Ayanokoji
      </>
    ),
  },
  githubUrl: siteConfig.links.github,
};
