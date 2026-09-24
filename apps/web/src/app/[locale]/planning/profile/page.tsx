"use client";

import { useEffect } from "react";
import { useRouter } from "../../../../i18n/navigation";

export default function ProfileRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/planning/studio");
  }, [router]);
  return <p className="text-sm text-muted-foreground">Opening studio…</p>;
}
