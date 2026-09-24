import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ManageConsultation } from "./manage-consultation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: `${t("consultation.manageTitle")} | Ceylon Weddings`, robots: { index: false } };
}

export default async function ManageConsultationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  return <ManageConsultation token={token} locale={locale} />;
}
