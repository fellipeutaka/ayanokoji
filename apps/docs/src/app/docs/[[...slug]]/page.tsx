import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { siteConfig } from "@/config/site";
import { parseGitHubUrl } from "@/lib/github";
import { getPageImage, source } from "@/lib/source";

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const { lastModified, body: MDX, toc, full, title, description } = page.data;

  const { owner, repo } = parseGitHubUrl(siteConfig.links.github);
  const path = `/apps/docs/src/content/docs/${page.path}`;

  return (
    <DocsPage
      editOnGithub={{
        owner,
        repo,
        path,
        sha: "main",
      }}
      full={full}
      lastUpdate={lastModified}
      toc={toc}
    >
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription className="mb-0">{description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          githubUrl={`${siteConfig.links.github}/blob/main/${path}`}
          markdownUrl={`${page.url}.mdx`}
        />
      </div>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, Tab, Tabs }} />
      </DocsBody>
    </DocsPage>
  );
}
