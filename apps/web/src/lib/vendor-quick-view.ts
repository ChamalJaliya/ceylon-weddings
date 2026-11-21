import type { Vendor } from "@ceylonweddings/contracts";
import type { VendorQuickViewData } from "@ceylonweddings/ui/domain/vendor-quick-view";

/** Shape a catalog vendor for the quick-view modal. */
export function toQuickView(vendor: Vendor, category: string, priceBand: string): VendorQuickViewData {
  const photos = [...new Set([vendor.photoUrl, ...(vendor.photos ?? [])].filter(Boolean) as string[])].slice(0, 8);
  const highlights = vendor.includedInPrice ?? [];
  return {
    name: vendor.name,
    category,
    location: `${vendor.city}, ${vendor.district}`,
    priceBand,
    rating: vendor.ratingAvg,
    ratingCount: vendor.ratingCount,
    photos,
    description: vendor.description,
    highlights: [...new Set(highlights)],
    verified: vendor.verified,
    featured: vendor.featured,
    yearsExperience: vendor.yearsExperience,
    couplesServed: vendor.couplesServed,
    whatsapp: vendor.whatsapp,
    href: `/vendors/${vendor.slug}`,
  };
}
