"use client";

import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { cn } from "@ceylonweddings/ui/utils";
import { Link, usePathname } from "../../../../i18n/navigation";

const TABS = [
  { href: "/admin/settings", label: "Overview", exact: true },
  { href: "/admin/settings/site", label: "Site" },
  { href: "/admin/settings/pages", label: "Pages" },
  { href: "/admin/settings/categories", label: "Vendor types" },
  { href: "/admin/settings/flags", label: "Flags" },
  { href: "/admin/settings/awards", label: "Awards" },
  { href: "/admin/settings/consultations", label: "Consultations" },
] as const;

export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card/50 p-1">
        {TABS.map((tab) => {
          const exact = "exact" in tab && tab.exact;
          const active = exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.href === "/admin/settings" ? <Settings className="size-3.5" /> : null}
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
