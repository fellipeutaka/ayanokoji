import { docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader } from "fumadocs-core/source";
import { createElement } from "react";
import { Icons } from "@/components/ui/icons";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in Icons) {
      return createElement(Icons[icon as keyof typeof Icons]);
    }
  },
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
