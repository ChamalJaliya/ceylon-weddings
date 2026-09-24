import type { Metadata } from "next";
import { fetchPublicCmsPage, renderCmsBody } from "../../../lib/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("about");
  return {
    title: page?.seo?.title ?? page?.title ?? "About us — Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function AboutPage() {
  const page = await fetchPublicCmsPage("about");
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        About page is not published yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">Our story</p>
        <h1 className="font-serif text-5xl tracking-tight lg:text-6xl">{page.title}</h1>
        {page.excerpt ? <p className="text-lg text-muted-foreground">{page.excerpt}</p> : null}
      </div>
      <div className="space-y-5">{renderCmsBody(page.body)}</div>
    </div>
  );
}
