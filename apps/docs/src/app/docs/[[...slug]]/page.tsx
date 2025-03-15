import { Icons } from "@/components/ui/icons";
import { getEditURL } from "@/lib/github";
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

const FILE_PATH_REGEX = /ayanokoji\/(.+)$/;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const {
    lastModified,
    _file,
    body: MDX,
    toc,
    full,
    title,
    description,
  } = page.data;

  const filePath = _file.absolutePath.match(FILE_PATH_REGEX)?.[1] ?? "";
  const lastModifiedDate = lastModified ? new Date(lastModified) : null;

  return (
    <DocsPage toc={toc} full={full}>
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents, Tab, Tabs }} />
        <div className="text-sm text-fd-muted-foreground my-8 flex items-center justify-between flex-wrap gap-x-12">
          <a
            className="flex items-center gap-2 text-fd-muted-foreground no-underline hover:opacity-100 hover:text-fd-primary transition"
            href={getEditURL(filePath)}
          >
            Edit on GitHub <Icons.ExternalLink className="size-3" />
          </a>

          <p>Last modified: {lastModifiedDate?.toLocaleString() ?? "--"}</p>
        </div>
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
