import { loader } from "fumadocs-core/source";
import type { InferPageType } from "fumadocs-core/source";
import { docs } from "fumadocs-mdx:collections/server";

import { Icons } from "@/components/ui/icons";

import { resolveIcon } from "./resolve-icon";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  icon(icon) {
    return resolveIcon(icon, Icons);
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
