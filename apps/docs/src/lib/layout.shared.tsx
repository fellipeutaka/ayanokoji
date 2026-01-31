import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Icons } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";

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
        <Icons.Logo className="size-5" data-active="true" />
        Ayanokoji
      </>
    ),
  },
  githubUrl: siteConfig.links.github,
};
