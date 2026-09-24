import { Suspense } from "react";
import { CatalogFallback, VendorsCatalog } from "./vendors-catalog";

export default function VendorsPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <VendorsCatalog />
    </Suspense>
  );
}
