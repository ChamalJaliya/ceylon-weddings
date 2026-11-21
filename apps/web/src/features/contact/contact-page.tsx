import type { Metadata } from "next";
import { fetchPublicCmsPage, fetchPublicSiteConfig, renderCmsBody } from "@/lib/public-site";
import { ContactContent } from "@/features/contact/contact-content";

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
    <>
      <ContactContent
        heroTitle={page?.title}
        heroSub={page?.excerpt ?? undefined}
        contactEmail={site.branding.contactEmail}
        contactPhone={site.branding.contactPhone}
        whatsapp={site.branding.whatsapp}
      />
      {page?.body ? <div className="mx-auto max-w-3xl space-y-4 px-6 pb-20">{renderCmsBody(page.body)}</div> : null}
    </>
  );
}
