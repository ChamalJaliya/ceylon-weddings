"use client";

import { type ReactNode, useEffect } from "react";
import { api, useAuthStore } from "@ceylonweddings/web";
import { usePathname } from "../i18n/navigation";
import { PublicChrome, GuestChrome } from "./public-chrome";
import { AdminShell, PlanningShell, ProShell } from "./dashboard-shell";
import { RoleGate, ADMIN_ROLES, PLANNING_ROLES, PRO_ROLES, SIGNED_IN_ROLES } from "./role-gate";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useRememberReturnPath } from "@/features/settings/return-path";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  // Settings' "← Back" returns to the last page outside settings.
  useRememberReturnPath(pathname);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null));
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
  // Settings is its own context: no dashboard rail, any signed-in role.
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return (
      <RoleGate allow={SIGNED_IN_ROLES}>
        <SettingsShell>{children}</SettingsShell>
      </RoleGate>
    );
  }
  // The inbox lives in whichever dashboard the role uses (Kloqra: /notifications in the app shell).
  if (pathname === "/notifications") {
    const Shell = user?.role === "VENDOR" ? ProShell : user?.role === "ADMIN" ? AdminShell : PlanningShell;
    return (
      <RoleGate allow={SIGNED_IN_ROLES}>
        <Shell>{children}</Shell>
      </RoleGate>
    );
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
  if (
    (pathname.startsWith("/vendors") || pathname.startsWith("/ideas")) &&
    (user?.role === "COUPLE" || user?.role === "FAMILY")
  ) {
    return <PlanningShell>{children}</PlanningShell>;
  }
  return <PublicChrome>{children}</PublicChrome>;
}
