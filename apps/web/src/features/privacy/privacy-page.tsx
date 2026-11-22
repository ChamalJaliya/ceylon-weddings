import type { Metadata } from "next";
import { fetchPublicCmsPage } from "@/lib/public-site";
import { LegalDocument } from "@/features/legal/legal-document";

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
    <LegalDocument
      kind="privacy"
      title={page.title}
      excerpt={page.excerpt ?? null}
      body={page.body}
      updatedAt={page.updatedAt}
    />
  );
}
