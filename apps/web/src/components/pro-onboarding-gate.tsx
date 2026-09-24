"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api, useAuthStore } from "@ceylonweddings/web";
import { attributesRequiredComplete } from "@ceylonweddings/contracts";
import { usePathname, useRouter } from "../i18n/navigation";

function needsOnboarding(vendor: {
  category?: string | null;
  onboardingCompletedAt?: string | null;
  attributeCompleteness?: {
    requiredDone: number;
    requiredTotal: number;
  } | null;
}) {
  // Migration-backfilled / already-finished vendors skip the wizard.
  if (vendor.onboardingCompletedAt) return false;
  if (!vendor.category) return true;
  return !attributesRequiredComplete(vendor.attributeCompleteness);
}

export function ProOnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [ready, setReady] = useState(false);
  const onOnboard = pathname.startsWith("/pro/onboard");

  useEffect(() => {
    if (!user || user.role !== "VENDOR") {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    api.vendors
      .mine()
      .then((vendor) => {
        if (cancelled) return;
        const incomplete = needsOnboarding(vendor);
        if (incomplete && !onOnboard) {
          router.replace("/pro/onboard");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [onOnboard, router, user]);

  if (!ready) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading…</p>;
  }

  return children;
}
