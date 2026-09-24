import type { Metadata } from "next";
import { fetchPublicCmsPage, renderCmsBody } from "../../../lib/public-site";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("privacy");
  return {
    title: page?.seo?.title ?? "Privacy Policy | Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function PrivacyPage() {
  const page = await fetchPublicCmsPage("privacy");
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">
        Privacy policy is not published yet.
      </div>
    );
  }

  return (
    <main className="cw-section mx-auto max-w-3xl space-y-8 px-6 py-16">
      <div className="mb-4 space-y-3 text-center">
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">{page.title}</h1>
        {page.excerpt ? <p className="text-lg text-muted-foreground">{page.excerpt}</p> : null}
      </div>
      <div className="space-y-5">{renderCmsBody(page.body)}</div>
    </main>
  );
}
