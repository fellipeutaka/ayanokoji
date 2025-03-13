import { docs } from "@/.source";
import { Icons } from "@/components/ui/icons";
import { loader } from "fumadocs-core/source";
import { createElement } from "react";

// `loader()` also assign a URL to your pages
// See https://fumadocs.vercel.app/docs/headless/source-api for more info
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
