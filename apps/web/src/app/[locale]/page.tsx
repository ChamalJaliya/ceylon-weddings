import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Vendor } from "@ceylonweddings/contracts";
import { vendorPassesPresentationGate } from "@ceylonweddings/contracts";
import { CATEGORY_LABELS, localizedText } from "../../lib/labels";
import { fetchPublicFlags, fetchPublicSiteConfig } from "../../lib/public-site";
import type { PublicVendorTypeListItem } from "@ceylonweddings/contracts";
import { HomeContent } from "./home-content";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function featuredVendors(): Promise<Vendor[]> {
  const response = await fetch(`${apiUrl}/vendors?featured=true&pageSize=12&sort=featured`, {
    cache: "no-store",
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: Vendor[] } | Vendor[];
  const items = Array.isArray(payload) ? payload : (payload.items ?? []);
  return items.filter((vendor) => vendor.featured && vendorPassesPresentationGate(vendor)).slice(0, 6);
}

async function vendorTypes(): Promise<PublicVendorTypeListItem[]> {
  const response = await fetch(`${apiUrl}/vendor-types`, { cache: "no-store" });
  if (!response.ok) return [];
  return (await response.json()) as PublicVendorTypeListItem[];
}

export async function generateMetadata(): Promise<Metadata> {
  const { homepage } = await fetchPublicSiteConfig();
  return {
    title: homepage.seo.title,
    description: homepage.seo.description,
    openGraph: {
      title: homepage.seo.title,
      description: homepage.seo.description,
      images: [homepage.seo.ogImage],
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations();
  const [{ homepage }, flags, vendors, types] = await Promise.all([
    fetchPublicSiteConfig(),
    fetchPublicFlags(),
    featuredVendors(),
    vendorTypes(),
  ]);
  const typeLabelBySlug = Object.fromEntries(
    types.map((type) => [type.slug, localizedText(type.label)]),
  );
  const adsEnabled = flags["ads.public"] !== false;
  const browseCategories = homepage.categoryKeys.map((key) => ({
    key,
    label: typeLabelBySlug[key] ?? CATEGORY_LABELS[key] ?? key,
  }));

  return (
    <HomeContent
      homepage={homepage}
      adsEnabled={adsEnabled}
      vendors={vendors}
      browseCategories={browseCategories}
      typeLabelBySlug={typeLabelBySlug}
      copy={{
        kicker: t("marketing.kicker"),
        tagline: t("app.tagline"),
        ceylonPicks: t("knotly.ceylonPicks"),
        suggestedVendors: t("hub.suggestedVendors"),
        viewAll: t("hub.viewAll"),
        marketingSub: t("marketing.sub"),
        inquirePricing: t("knotly.inquirePricing"),
      }}
    />
  );
}
