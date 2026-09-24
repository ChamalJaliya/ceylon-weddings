import { Suspense } from "react";
import VendorComparePage from "./compare-client";

export default function VendorCompareRoute() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading compare…</p>}>
      <VendorComparePage />
    </Suspense>
  );
}
