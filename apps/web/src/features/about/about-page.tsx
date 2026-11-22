import type { Metadata } from "next";
import { fetchPublicCmsPage, fetchPublicSiteConfig } from "@/lib/public-site";
import { AboutContent } from "./about-content";
import { parseAboutBody } from "./about-story";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("about");
  return {
    title: page?.seo?.title ?? page?.title ?? "About us — Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function AboutPage() {
  const [page, site] = await Promise.all([fetchPublicCmsPage("about"), fetchPublicSiteConfig()]);
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">About page is not published yet.</div>
    );
  }

  return (
    <AboutContent
      story={parseAboutBody(page.title, page.excerpt ?? null, page.body)}
      stats={site.homepage.stats ?? []}
    />
  );
}
