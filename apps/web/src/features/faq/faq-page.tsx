import type { Metadata } from "next";
import { fetchPublicCmsPage } from "@/lib/public-site";
import { FaqContent } from "./faq-content";

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
    return <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">FAQ is not published yet.</div>;
  }

  return <FaqContent title={page.title} excerpt={page.excerpt ?? null} body={page.body} />;
}
