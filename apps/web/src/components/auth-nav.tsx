"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { api, useAuthStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "../i18n/navigation";

function homeForRole(role: string | undefined) {
  if (role === "VENDOR") return "/pro";
  if (role === "ADMIN") return "/admin";
  if (role === "COUPLE" || role === "FAMILY") return "/planning";
  return "/login";
}

export function AuthNav({ overlay = false }: { overlay?: boolean }) {
  const t = useTranslations();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const overlayClass = overlay
    ? "text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
    : undefined;

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, [setUser]);

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button asChild size="sm" variant="ghost" shape="pill" className={overlayClass}>
          <Link href="/login">{t("nav.signIn")}</Link>
        </Button>
        <Button
          asChild
          size="sm"
          shape="pill"
          className={cn(overlay && "bg-hero-foreground text-background hover:bg-hero-foreground/90")}
        >
          <Link href="/register">{t("auth.register")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild size="sm" variant={overlay ? "ghost" : "outline"} shape="pill" className={overlayClass}>
        <Link href={homeForRole(user.role)}>{t("nav.dashboard")}</Link>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        shape="pill"
        className={overlayClass}
        onClick={async () => {
          await api.logout();
          setUser(null);
        }}
      >
        {t("nav.signOut")}
      </Button>
    </div>
  );
}

export { homeForRole };
