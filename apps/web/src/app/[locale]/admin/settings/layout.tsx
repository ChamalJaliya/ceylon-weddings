"use client";

import type { ReactNode } from "react";
import { CalendarClock, CreditCard, FileText, Flag, Layers, Settings, Sparkles, Trophy } from "lucide-react";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { Link, usePathname } from "../../../../i18n/navigation";

const TABS = [
  { id: "overview", href: "/admin/settings", label: "Overview", icon: Settings, exact: true },
  { id: "categories", href: "/admin/settings/categories", label: "Vendor types", icon: Layers },
  { id: "plans", href: "/admin/settings/plans", label: "Plans", icon: CreditCard },
  { id: "consultations", href: "/admin/settings/consultations", label: "Consultations", icon: CalendarClock },
  { id: "site", href: "/admin/settings/site", label: "Site", icon: Sparkles },
  { id: "pages", href: "/admin/settings/pages", label: "Pages", icon: FileText },
  { id: "awards", href: "/admin/settings/awards", label: "Awards", icon: Trophy },
  { id: "flags", href: "/admin/settings/flags", label: "Flags", icon: Flag },
] as const;

function resolveActiveId(pathname: string) {
  const match = TABS.find((tab) => {
    if ("exact" in tab && tab.exact) return pathname === tab.href;
    return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  });
  return match?.id ?? "overview";
}

export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeId = resolveActiveId(pathname);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <HorizontalTabs
        ariaLabel="Settings sections"
        className="min-w-0"
        activeId={activeId}
        linkComponent={Link}
        items={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          href: tab.href,
        }))}
      />
      {children}
    </div>
  );
}
