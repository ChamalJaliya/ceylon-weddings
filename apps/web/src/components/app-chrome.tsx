"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { api, useAuthStore } from "@ceylonweddings/web";
import { usePathname } from "../i18n/navigation";
import { PublicChrome, GuestChrome } from "./public-chrome";
import { AdminShell, PlanningShell, ProShell } from "./dashboard-shell";
import { RoleGate, ADMIN_ROLES, PLANNING_ROLES, PRO_ROLES } from "./role-gate";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, [setUser]);

  if (pathname === "/login" || pathname === "/register") {
    return children;
  }
  if (pathname.startsWith("/music-brief/")) {
    return <GuestChrome>{children}</GuestChrome>;
  }
  if (pathname.startsWith("/moodboard/")) {
    return <GuestChrome>{children}</GuestChrome>;
  }
  if (pathname.startsWith("/w/")) {
    return <GuestChrome>{children}</GuestChrome>;
  }
  if (pathname.startsWith("/planning")) {
    return (
      <RoleGate allow={PLANNING_ROLES}>
        <PlanningShell>{children}</PlanningShell>
      </RoleGate>
    );
  }
  if (pathname.startsWith("/pro")) {
    return (
      <RoleGate allow={PRO_ROLES}>
        <ProShell>{children}</ProShell>
      </RoleGate>
    );
  }
  if (pathname.startsWith("/admin")) {
    return (
      <RoleGate allow={ADMIN_ROLES}>
        <AdminShell>{children}</AdminShell>
      </RoleGate>
    );
  }
  if ((pathname.startsWith("/vendors") || pathname.startsWith("/ideas")) && (user?.role === "COUPLE" || user?.role === "FAMILY")) {
    return <PlanningShell>{children}</PlanningShell>;
  }
  return <PublicChrome>{children}</PublicChrome>;
}
