"use client";

import { HowItWorksContent } from "@/features/how-it-works/how-it-works-content";

/** /for-vendors is the merged "How it works" page with the vendor side selected. */
export function ForVendorsContent() {
  return <HowItWorksContent initialAudience="vendors" />;
}
