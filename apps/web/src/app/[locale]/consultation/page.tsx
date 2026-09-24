import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchConsultationAvailability, fetchPublicFlags, fetchPublicSiteConfig } from "../../../lib/public-site";
import { ConsultationContent } from "./consultation-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("consultation.title")} | Ceylon Weddings`,
    description: t("consultation.subtitle"),
  };
}

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [availability, flags, site] = await Promise.all([
    fetchConsultationAvailability(21),
    fetchPublicFlags(),
    fetchPublicSiteConfig(),
  ]);
  const open = availability.enabled && flags["consultations.public"] !== false;

  return (
    <ConsultationContent
      availability={availability}
      open={open}
      locale={locale}
      contactEmail={site.branding.contactEmail}
      whatsapp={site.branding.whatsapp}
    />
  );
}
