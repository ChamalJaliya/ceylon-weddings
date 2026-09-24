"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api, useAuthStore } from "@ceylonweddings/web";
import { usePathname, useRouter } from "../i18n/navigation";

export function CoupleOnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [ready, setReady] = useState(false);
  const onOnboard = pathname.startsWith("/planning/onboard");

  useEffect(() => {
    if (!user || user.role !== "COUPLE") {
      if (user?.role === "FAMILY" && onOnboard) {
        router.replace("/planning");
        return;
      }
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    api.wedding
      .mine()
      .then((wedding) => {
        if (cancelled) return;
        const incomplete = !wedding.onboardingCompletedAt;
        if (incomplete && !onOnboard) {
          router.replace("/planning/onboard");
          return;
        }
        if (!incomplete && onOnboard) {
          router.replace("/planning");
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
