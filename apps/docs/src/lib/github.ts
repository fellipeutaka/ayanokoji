import { siteConfig } from "@/config/site";

export function getEditURL(filePath: string) {
  return `${siteConfig.links.github}/blob/main/${filePath}?plain=1`;
}
