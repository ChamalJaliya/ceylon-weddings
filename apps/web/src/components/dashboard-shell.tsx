"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePreferenceStore } from "@ceylonweddings/web";
import {
  Award,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Globe,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Megaphone,
  Menu,
  MessageCircle,
  Music2,
  Palette,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Store,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import {
  AppShell,
  AppShellBrand,
  AppShellCouple,
  AppShellNavGroup,
  AppShellNavItem,
} from "@ceylonweddings/ui/domain/app-shell";
import { AppHeader, AppHeaderSearch } from "@ceylonweddings/ui/domain/app-header";
import { AppFooter } from "@ceylonweddings/ui/domain/app-footer";
import { Icon, type IconComponent } from "@ceylonweddings/ui/components/icon";
import { IconButton } from "@ceylonweddings/ui/components/icon-button";
import { Link, usePathname } from "../i18n/navigation";
import { ShellTrail } from "./shell-trail";
import { useWedding } from "./use-wedding";
import { CommandPaletteProvider, useCommandPalette, type SearchAudience } from "./global-command-palette";

type ChromeKey =
  | "chrome.planning"
  | "chrome.people"
  | "chrome.marketplace"
  | "chrome.workspace"
  | "chrome.platform"
  | "chrome.opsSupport"
  | "chrome.opsContent";
type NavItem = { href: string; key: string; icon: IconComponent };
type NavGroup = { labelKey: ChromeKey; items: readonly NavItem[] };

const planningGroups: NavGroup[] = [
  {
    labelKey: "chrome.planning",
    items: [
      { href: "/planning", key: "dashboard", icon: LayoutDashboard },
      { href: "/planning/messages", key: "messages", icon: MessageCircle },
      { href: "/planning/studio", key: "studio", icon: UserRound },
      { href: "/planning/website", key: "website", icon: Globe },
      { href: "/planning/legal", key: "legal", icon: Scale },
      { href: "/planning/calendar", key: "calendar", icon: CalendarDays },
      { href: "/planning/agenda", key: "agenda", icon: ClipboardList },
      { href: "/planning/music", key: "music", icon: Music2 },
      { href: "/planning/moodboard", key: "moodboard", icon: Palette },
      { href: "/planning/checklist", key: "checklist", icon: ListChecks },
      { href: "/planning/budget", key: "costGuide", icon: Wallet },
    ],
  },
  {
    labelKey: "chrome.people",
    items: [
      { href: "/planning/guests", key: "guests", icon: Users },
      { href: "/planning/seating", key: "seating", icon: LayoutGrid },
      { href: "/planning/family", key: "family", icon: UserPlus },
    ],
  },
  {
    labelKey: "chrome.marketplace",
    items: [
      { href: "/vendors", key: "catalog", icon: Store },
      { href: "/awards", key: "awards", icon: Trophy },
      { href: "/ideas", key: "ideas", icon: Lightbulb },
      { href: "/planning/team", key: "team", icon: Briefcase },
    ],
  },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/planning" || href === "/pro" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const proGroups: NavGroup[] = [
  {
    labelKey: "chrome.workspace",
    items: [
      { href: "/pro", key: "dashboard", icon: LayoutDashboard },
      { href: "/pro/messages", key: "messages", icon: MessageCircle },
      { href: "/pro/storefront", key: "storefront", icon: Store },
      { href: "/pro/leads", key: "leads", icon: Briefcase },
      { href: "/pro/promote", key: "promote", icon: Megaphone },
      { href: "/pro/billing", key: "billing", icon: CreditCard },
      { href: "/awards", key: "awards", icon: Trophy },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    labelKey: "chrome.platform",
    items: [
      { href: "/admin", key: "dashboard", icon: LayoutDashboard },
      { href: "/admin/messages", key: "messages", icon: MessageCircle },
      { href: "/admin/vendors", key: "vendors", icon: Store },
      { href: "/admin/queues/verify", key: "verifyQueue", icon: ShieldAlert },
      { href: "/admin/queues/picks", key: "picksQueue", icon: Sparkles },
      { href: "/admin/queues/reports", key: "reportsQueue", icon: Flag },
    ],
  },
  {
    labelKey: "chrome.opsSupport",
    items: [
      { href: "/admin/users", key: "users", icon: Users },
      { href: "/admin/weddings", key: "weddings", icon: CalendarDays },
      { href: "/admin/inquiries", key: "inquiries", icon: Inbox },
      { href: "/admin/consultations", key: "consultations", icon: CalendarClock },
      { href: "/admin/reviews", key: "reviews", icon: Star },
    ],
  },
  {
    labelKey: "chrome.opsContent",
    items: [
      { href: "/admin/content", key: "content", icon: Lightbulb },
      { href: "/admin/ads", key: "ads", icon: Megaphone },
      { href: "/admin/featured", key: "featured", icon: Store },
      { href: "/admin/audit", key: "audit", icon: FileText },
      { href: "/admin/settings", key: "settings", icon: Settings },
    ],
  },
];

function DashboardShellInner({
  groups,
  kicker,
  couple,
  crumb,
  messages = false,
  searchPlaceholder,
  children,
}: {
  groups: NavGroup[];
  kicker: string;
  couple: { names: string; meta: string; initials: [string, string] };
  crumb?: string;
  messages?: boolean;
  searchPlaceholder: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const collapsed = usePreferenceStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = usePreferenceStore((s) => s.setSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggle } = useCommandPalette();

  return (
    <AppShell
      chrome="solid"
      collapsed={collapsed}
      onCollapsedChange={setSidebarCollapsed}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      mobileTitle={t("app.name")}
      brand={(mode) => (
        <AppShellBrand monogram="CW" name={t("app.name")} kicker={kicker} collapsed={mode} />
      )}
      nav={(mode) =>
        groups.map((group) => (
          <AppShellNavGroup key={group.labelKey} label={t(group.labelKey)} collapsed={mode}>
            {group.items.map((item) => {
              const label = t(`nav.${item.key}`);
              const isActive = isNavActive(pathname, item.href);
              return (
                <AppShellNavItem
                  key={item.href}
                  asChild
                  active={isActive}
                  collapsed={mode}
                  label={label}
                >
                  <Link href={item.href} onClick={() => setMobileOpen(false)}>
                    <Icon icon={item.icon} size="sm" />
                    <span className={mode ? "sr-only" : undefined}>{label}</span>
                  </Link>
                </AppShellNavItem>
              );
            })}
          </AppShellNavGroup>
        ))
      }
      railFooter={(mode) => (
        <AppShellCouple
          names={couple.names}
          meta={couple.meta}
          initials={couple.initials}
          collapsed={mode}
        />
      )}
      header={
        <AppHeader
          tone="glass"
          crumb={crumb}
          leading={
            <IconButton
              type="button"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Icon icon={Menu} size="sm" />
            </IconButton>
          }
          search={
            <AppHeaderSearch
              placeholder={searchPlaceholder}
              icon={<Icon icon={Search} size="sm" />}
              onClick={toggle}
              shortcut="⌘K"
            />
          }
          trail={<ShellTrail messages={messages} />}
        />
      }
      footer={
        <AppFooter
          wordmark={t("app.name")}
          kicker={t("chrome.footerKicker")}
          links={
            <>
              <Link href="/">{t("nav.home")}</Link>
              <Link href="/vendors">{t("nav.catalog")}</Link>
              <Link href="/planning">{t("nav.dashboard")}</Link>
              <Link href="/about">{t("nav.about")}</Link>
              <Link href="/faq">{t("nav.faq")}</Link>
              <Link href="/contact">{t("nav.contact")}</Link>
              <Link href="/privacy">{t("nav.privacy")}</Link>
              <Link href="/terms">{t("nav.terms")}</Link>
            </>
          }
          meta={t("chrome.footerMeta")}
        />
      }
    >
      <div className="flex-1 cw-page-pad">{children}</div>
    </AppShell>
  );
}

function DashboardShell(props: {
  groups: NavGroup[];
  kicker: string;
  couple: { names: string; meta: string; initials: [string, string] };
  crumb?: string;
  messages?: boolean;
  audience: SearchAudience;
  searchPlaceholder: string;
  children: ReactNode;
}) {
  const { audience, ...inner } = props;
  return (
    <CommandPaletteProvider audience={audience}>
      <DashboardShellInner {...inner} />
    </CommandPaletteProvider>
  );
}

export function PlanningShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const { data } = useWedding();
  const names = data ? `${data.partnerOneName} & ${data.partnerTwoName}` : t("app.name");
  const meta = data?.city
    ? `${data.city}${data.date ? ` · ${new Date(data.date).toLocaleDateString()}` : ""}`
    : t("chrome.footerMeta");
  const groups =
    data && !data.myAccess.canViewBudget
      ? planningGroups.map((group) => ({
          ...group,
          items: group.items.filter((item) => item.href !== "/planning/budget"),
        }))
      : planningGroups;

  return (
    <DashboardShell
      audience="planning"
      searchPlaceholder={t("prefs.searchPlanning")}
      groups={groups}
      kicker="Ceylon"
      messages
      crumb={data?.city ? `${data.city}` : t("hub.kicker")}
      couple={{
        names,
        meta,
        initials: [data?.partnerOneName?.[0] ?? "C", data?.partnerTwoName?.[0] ?? "W"],
      }}
    >
      {children}
    </DashboardShell>
  );
}

export function ProShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <DashboardShell
      audience="pro"
      searchPlaceholder={t("prefs.searchPro")}
      groups={proGroups}
      kicker="Vendor"
      messages
      crumb={t("nav.storefront")}
      couple={{ names: t("app.name"), meta: "Pro", initials: ["C", "W"] }}
    >
      {children}
    </DashboardShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <DashboardShell
      audience="admin"
      searchPlaceholder={t("prefs.searchAdmin")}
      groups={adminGroups}
      kicker="Admin"
      messages
      crumb={t("nav.dashboard")}
      couple={{ names: "Ceylon Ops", meta: t("chrome.footerMeta"), initials: ["C", "W"] }}
    >
      {children}
    </DashboardShell>
  );
}

