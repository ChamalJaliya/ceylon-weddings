"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@ceylonweddings/web";
import {
  DEFAULT_SITE_BRANDING,
  type PublicFlags,
  type SiteBranding,
} from "@ceylonweddings/contracts";
import { AppFooter } from "@ceylonweddings/ui/domain/app-footer";
import { cn } from "@ceylonweddings/ui/utils";
import { Link, usePathname } from "../i18n/navigation";
import { AuthNav } from "./auth-nav";
import { PreferenceControls } from "./preference-controls";

function usePublicSiteChrome() {
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING);
  const [flags, setFlags] = useState<PublicFlags>({
    "reviews.enabled": true,
    "awards.public": true,
    "ideas.public": true,
    "ads.public": true,
    "site.maintenance": false,
  });

  useEffect(() => {
    void Promise.all([api.site.config(), api.site.flags()])
      .then(([config, nextFlags]) => {
        setBranding(config.branding);
        setFlags(nextFlags);
      })
      .catch(() => undefined);
  }, []);

  return { branding, flags };
}

export function PublicHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const { branding, flags } = usePublicSiteChrome();
  const links = [
    { href: "/vendors", label: t("nav.catalog") },
    ...(flags["ideas.public"] !== false ? [{ href: "/ideas", label: t("nav.ideas") }] : []),
    { href: "/how-it-works", label: "How it works" },
    ...(flags["awards.public"] !== false ? [{ href: "/awards", label: "Awards" }] : []),
    ...(flags["consultations.public"] !== false
      ? [{ href: "/consultation", label: t("nav.consultation") }]
      : []),
    { href: "/for-vendors", label: t("nav.forVendors") },
  ];

  return (
    <div className="flex h-full min-w-0 flex-1 items-center gap-3 px-2 sm:px-3">
      <Link href="/" className="flex shrink-0 items-center gap-2 pl-1">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full border border-primary/35 font-serif text-xs text-primary">
            CW
          </span>
        )}
        <span className="hidden font-serif text-sm sm:inline">{t("app.name")}</span>
      </Link>
      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs tracking-wide",
              (link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`))
                ? "bg-secondary font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >

            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <PreferenceControls />
        <AuthNav />
      </div>
    </div>
  );
}

export function PublicChrome({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { branding, flags } = usePublicSiteChrome();
  const showMaintenance =
    flags["site.maintenance"] === true || branding.maintenanceBanner.enabled;
  const companyLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/how-it-works", label: "How It Works" },
    ...(flags["ideas.public"] !== false ? [{ href: "/ideas", label: "Ideas & Inspiration" }] : []),
    ...(flags["awards.public"] !== false ? [{ href: "/awards", label: "Awards" }] : []),
    ...(flags["consultations.public"] !== false
      ? [{ href: "/consultation", label: t("nav.consultation") }]
      : []),
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/privacy", label: t("nav.privacy") },
    { href: "/terms", label: t("nav.terms") },
  ];

  return (
    <div className="cw-page-frame relative flex min-h-screen flex-col bg-background">
      <div className="cw-frame-ring" aria-hidden />
      <header className="cw-page-notch">
        <div className="cw-notch-ear" aria-hidden />
        <div className="cw-notch-bar">
          <PublicHeader />
        </div>
        <div className="cw-notch-ear" aria-hidden />
      </header>
      {showMaintenance && branding.maintenanceBanner.message ? (
        <div className="relative z-10 mt-[calc(var(--cw-frame-top)+var(--cw-notch-height))] bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
          {branding.maintenanceBanner.message}
        </div>
      ) : null}
      <main
        className={
          isHome
            ? "flex-1"
            : "mx-auto w-full max-w-6xl flex-1 px-6 pb-10 pt-[calc(var(--cw-frame-top)+var(--cw-notch-height)+1.5rem)]"
        }
      >
        {children}
      </main>
      <AppFooter
        className="relative z-10 pb-[calc(var(--cw-frame-bottom)+1rem)]"
        wordmark={t("app.name")}
        kicker={t("chrome.footerKicker")}
        tagline={branding.tagline}
        description={branding.footerBlurb}
        linkComponent={Link}
        sections={[
          {
            title: "Marketplace",
            links: [
              { href: "/vendors", label: "All Vendors Directory" },
              { href: "/vendors?category=VENUE", label: "Venues & Reception Halls" },
              { href: "/vendors?category=PHOTO_VIDEO", label: "Photo & Video Studios" },
              { href: "/vendors?category=PORUWA", label: "Poruwa Specialists" },
              { href: "/vendors?category=FLORIST_DECOR", label: "Florists & Decor" },
              { href: "/vendors?category=CATERER", label: "Catering & Feasts" },
            ],
          },
          {
            title: "Planning Tools",
            links: [
              { href: "/planning", label: "Planning Dashboard", badge: "Free" },
              { href: "/planning/checklist", label: "Checklist Manager" },
              { href: "/planning/budget", label: "LKR Budget Splitter" },
              { href: "/planning/guests", label: "Guest List & RSVPs" },
              { href: "/planning/website", label: "Wedding Website Builder" },
            ],
          },
          {
            title: "For Vendors",
            links: [
              { href: "/for-vendors", label: "Vendor Overview" },
              { href: "/register?role=VENDOR", label: "List Your Business", badge: "Join" },
              { href: "/login", label: "Vendor Portal Login" },
            ],
          },
          {
            title: "Company",
            links: companyLinks,
          },
        ]}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <p>
              © {new Date().getFullYear()} Ceylon Weddings.{" "}
              {branding.contactEmail ? (
                <a href={`mailto:${branding.contactEmail}`} className="underline-offset-2 hover:underline">
                  {branding.contactEmail}
                </a>
              ) : null}
            </p>
          </div>
        }
      />
    </div>
  );
}

export function PageFrame({
  header,
  children,
  lock = false,
}: {
  header: ReactNode;
  children: ReactNode;
  lock?: boolean;
}) {
  return (
    <div
      className={cn(
        "cw-page-frame relative bg-background",
        lock ? "cw-page-locked flex h-dvh flex-col overflow-hidden" : "flex min-h-screen flex-col",
      )}
    >
      <div className="cw-frame-ring" aria-hidden />
      <header className="cw-page-notch">
        <div className="cw-notch-ear" aria-hidden />
        <div className="cw-notch-bar">{header}</div>
        <div className="cw-notch-ear" aria-hidden />
      </header>
      <div
        className={cn("relative flex min-h-0 flex-1 flex-col", lock && "overflow-hidden")}
        style={
          lock
            ? {
                paddingTop: "calc(var(--cw-frame-top) + var(--cw-notch-height))",
                paddingRight: "var(--cw-frame-right)",
                paddingBottom: "var(--cw-frame-bottom)",
                paddingLeft: "var(--cw-frame-left)",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

export function GuestChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end px-6 py-4">
        <PreferenceControls />
      </div>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
