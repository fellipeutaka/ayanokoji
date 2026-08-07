import { loader } from "fumadocs-core/source";
import type { InferPageType } from "fumadocs-core/source";
import { docs } from "fumadocs-mdx:collections/server";
import { createElement } from "react";

import { Icons } from "@/components/ui/icons";

function isIconName(icon: string): icon is keyof typeof Icons {
  return Object.hasOwn(Icons, icon);
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) {
      return;
    }

    if (isIconName(icon)) {
      return createElement(Icons[icon]);
    }
  },
  source: docs.toFumadocsSource(),
});

export type SourcePage = InferPageType<typeof source>;

export function getPageImage(page: SourcePage) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: SourcePage) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
