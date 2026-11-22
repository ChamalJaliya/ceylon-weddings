import type { Metadata } from "next";
import { fetchPublicCmsPage } from "@/lib/public-site";
import { LegalDocument } from "@/features/legal/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("terms");
  return {
    title: page?.seo?.title ?? "Terms of Service | Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function TermsPage() {
  const page = await fetchPublicCmsPage("terms");
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-muted-foreground">Terms are not published yet.</div>
    );
  }

  return (
    <LegalDocument
      kind="terms"
      title={page.title}
      excerpt={page.excerpt ?? null}
      body={page.body}
      updatedAt={page.updatedAt}
    />
  );
}
