import type { Metadata } from "next";
import { fetchPublicCmsPage, renderCmsBody } from "../../../lib/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("faq");
  return {
    title: page?.seo?.title ?? "FAQ | Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function FAQPage() {
  const page = await fetchPublicCmsPage("faq");
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        FAQ is not published yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-3 text-center">
        <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">{page.title}</h1>
        {page.excerpt ? (
          <p className="text-lg text-muted-foreground leading-relaxed">{page.excerpt}</p>
        ) : null}
      </div>
      <div className="space-y-5">{renderCmsBody(page.body)}</div>
    </div>
  );
}
