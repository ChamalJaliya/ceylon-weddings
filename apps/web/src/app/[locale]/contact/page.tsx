import type { Metadata } from "next";
import { fetchPublicCmsPage, fetchPublicSiteConfig, renderCmsBody } from "../../../lib/public-site";
import { ContactContent } from "./contact-content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicCmsPage("contact");
  return {
    title: page?.seo?.title ?? "Contact Us | Ceylon Weddings",
    description: page?.seo?.description ?? page?.excerpt ?? undefined,
  };
}

export default async function ContactPage() {
  const [page, site] = await Promise.all([fetchPublicCmsPage("contact"), fetchPublicSiteConfig()]);

  return (
    <div className="space-y-10">
      {page ? (
        <div className="mx-auto max-w-3xl space-y-4 px-6 pt-8 text-center">
          <h1 className="font-serif text-5xl tracking-tight">{page.title}</h1>
          {page.excerpt ? <p className="text-lg text-muted-foreground">{page.excerpt}</p> : null}
          <div className="space-y-4 text-left">{renderCmsBody(page.body)}</div>
        </div>
      ) : null}
      <ContactContent
        contactEmail={site.branding.contactEmail}
        contactPhone={site.branding.contactPhone}
        whatsapp={site.branding.whatsapp}
      />
    </div>
  );
}
