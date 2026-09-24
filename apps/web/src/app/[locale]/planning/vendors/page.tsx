"use client";

import { useEffect } from "react";
import { useRouter } from "../../../../i18n/navigation";

export default function PlanningVendorsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vendors");
  }, [router]);
  return null;
}
