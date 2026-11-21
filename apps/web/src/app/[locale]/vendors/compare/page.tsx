import { Suspense } from "react";
import VendorComparePage from "@/features/vendors/compare/compare-client";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";

export default function VendorCompareRoute() {
  return (
    <Suspense fallback={<CenteredLoader label="Loading compare…" />}>
      <VendorComparePage />
    </Suspense>
  );
}
