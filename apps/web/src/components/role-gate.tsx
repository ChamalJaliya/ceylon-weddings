"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@ceylonweddings/contracts";
import { api, useAuthStore } from "@ceylonweddings/web";
import { useRouter } from "../i18n/navigation";
import { homeForRole } from "./auth-nav";

export const PLANNING_ROLES: Role[] = ["COUPLE", "FAMILY"];
export const PRO_ROLES: Role[] = ["VENDOR", "ADMIN"];
export const ADMIN_ROLES: Role[] = ["ADMIN"];

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [allow, ready, router, user]);

  if (!ready || !user || !allow.includes(user.role)) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading…</p>;
  }

  return children;
}
