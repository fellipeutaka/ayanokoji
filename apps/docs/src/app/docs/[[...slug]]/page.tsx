import { siteConfig } from "@/config/site";
import { parseGitHubUrl } from "@/lib/github";
import { source } from "@/lib/source";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const { lastModified, body: MDX, toc, full, title, description } = page.data;

  const { owner, repo } = parseGitHubUrl(siteConfig.links.github);

  return (
    <DocsPage
      editOnGithub={{
        owner,
        repo,
        path: `/apps/docs/src/content/docs/${page.file.path}`,
        sha: "main",
      }}
      lastUpdate={lastModified}
      toc={toc}
      full={full}
    >
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, Tab, Tabs }} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
