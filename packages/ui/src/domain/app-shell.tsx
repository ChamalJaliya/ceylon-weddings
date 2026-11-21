"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { AnimateIcon, Icon } from "../components/icon";
import { Tooltip } from "../components/tooltip";
import { BrandLockup, BrandMark } from "./brand-mark";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../components/sheet";

type RailRender = (collapsed: boolean) => React.ReactNode;

const resolve = (value: RailRender | React.ReactNode | undefined, mode: boolean) => {
  if (value == null) return null;
  return typeof value === "function" ? (value as RailRender)(mode) : value;
};

/**
 * Dashboard shell with a Kloqra-style rail: sticky brand, scrolling nav, footer,
 * an edge toggle that straddles the border, and a collapsed logo that expands.
 * Look lives in styles/components/nav.css (.shell-rail, .shell-nav-item).
 */
export function AppShell({
  chrome = "solid",
  brand,
  nav,
  header,
  footer,
  railFooter,
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  mobileTitle = "Menu",
  children,
}: {
  chrome?: "overlay" | "solid";
  brand: RailRender | React.ReactNode;
  nav: RailRender | React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  railFooter?: RailRender | React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  mobileTitle?: string;
  children: React.ReactNode;
}) {
  const rail = (mode: boolean, desktop: boolean) => (
    <>
      <div className={cn("shrink-0 px-4 pt-5 pb-4", mode && "flex justify-center px-2")}>
        {mode && desktop && onCollapsedChange ? (
          <button
            type="button"
            className="shell-rail__logo grid size-11 place-items-center rounded-xl focus-visible:outline-none"
            aria-label="Expand sidebar"
            onClick={() => onCollapsedChange(false)}
          >
            <span className="shell-rail__logo-mark">{resolve(brand, true)}</span>
            <span className="shell-rail__logo-expand size-8 place-items-center rounded-full bg-accent text-foreground">
              <Icon icon={ChevronRight} size="sm" lottie={false} />
            </span>
          </button>
        ) : (
          resolve(brand, mode)
        )}
      </div>
      <div className={cn("mx-4 h-px shrink-0 bg-sidebar-border", mode && "mx-auto w-6")} aria-hidden />
      <nav
        aria-label="Main"
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto pt-4 pb-4",
          mode ? "items-stretch px-2" : "gap-5 px-3",
        )}
      >
        {resolve(nav, mode)}
      </nav>
      {railFooter ? (
        <div
          className={cn(
            "mt-auto shrink-0 border-t border-sidebar-border px-4 py-4",
            mode && "flex justify-center px-2",
          )}
        >
          {resolve(railFooter, mode)}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      data-slot="app-shell"
      data-collapsed={collapsed ? "true" : undefined}
      className="flex min-h-screen bg-background"
    >
      <aside className="shell-rail hidden lg:flex" data-collapsed={collapsed ? "true" : "false"}>
        {onCollapsedChange ? (
          <button
            type="button"
            className="shell-rail__toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <Icon icon={ChevronLeft} size="xs" lottie={false} />
          </button>
        ) : null}
        {rail(collapsed, true)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="gap-0 bg-sidebar p-0 lg:hidden" showClose>
          <SheetHeader className="sr-only">
            <SheetTitle>{mobileTitle}</SheetTitle>
            <SheetDescription>{mobileTitle}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">{rail(false, false)}</div>
        </SheetContent>
      </Sheet>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {header ? (
          <header
            className={cn(
              "z-20 px-4 pt-4 sm:px-5 sm:pt-5",
              chrome === "overlay"
                ? "pointer-events-none absolute inset-x-0 top-0"
                : "sticky top-0 bg-background/70 pb-2 backdrop-blur-md",
            )}
          >
            <div className="pointer-events-auto">{header}</div>
          </header>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col cw-page-enter">{children}</div>
        {footer}
      </div>
    </div>
  );
}

/** A labelled nav section; collapsed rails show a hairline between sections instead. */
export function AppShellNavGroup({
  label,
  children,
  collapsed,
  first = false,
}: {
  label: string;
  children: React.ReactNode;
  collapsed?: boolean;
  /** No hairline above the first collapsed section. */
  first?: boolean;
}) {
  return (
    <div data-slot="nav-group" className={cn("grid", collapsed ? "gap-1" : "gap-0.5")}>
      {collapsed ? (
        first ? null : (
          <div className="shell-rail__hairline" aria-hidden />
        )
      ) : (
        <p className="shell-rail__group-label">{label}</p>
      )}
      {children}
    </div>
  );
}

/**
 * Rail link. Pass the link (Next `Link`) as the child with `asChild`.
 * Collapsed items get a tooltip; `badge` shows a count (dot on the icon when collapsed).
 */
export function AppShellNavItem({
  className,
  active,
  asChild = false,
  collapsed,
  label,
  badge,
  children,
  ...props
}: React.ComponentProps<"a"> & {
  active?: boolean;
  asChild?: boolean;
  collapsed?: boolean;
  label?: string;
  badge?: number | string | null;
}) {
  const Comp = asChild ? Slot : "a";
  const showBadge = badge !== undefined && badge !== null && badge !== "" && badge !== 0;
  const badgeText = typeof badge === "number" && badge > 99 ? "99+" : badge;

  const link = (
    <AnimateIcon animateOnHover animateOnTap asChild>
      <Comp
        data-slot="nav-item"
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn("shell-nav-item", collapsed && "shell-nav-item--collapsed", className)}
        {...props}
      >
        {asChild && React.isValidElement(children) ? (
          React.cloneElement(
            children as React.ReactElement<{ children?: React.ReactNode }>,
            undefined,
            <>
              {(children as React.ReactElement<{ children?: React.ReactNode }>).props.children}
              {showBadge ? (
                <span
                  className={cn("shell-nav-badge", collapsed && "shell-nav-badge--dot")}
                  aria-label={`${badge} new`}
                >
                  {badgeText}
                </span>
              ) : null}
            </>,
          )
        ) : (
          <>
            {children}
            {showBadge ? (
              <span className={cn("shell-nav-badge", collapsed && "shell-nav-badge--dot")}>{badgeText}</span>
            ) : null}
          </>
        )}
      </Comp>
    </AnimateIcon>
  );

  if (!collapsed || !label) return link;
  return <Tooltip content={label}>{link}</Tooltip>;
}

export function AppShellBrand({ name, collapsed }: { name: string; collapsed?: boolean }) {
  if (collapsed) {
    return <BrandMark title={name} cutColor="var(--sidebar)" className="h-10 w-auto text-primary" />;
  }
  return (
    <BrandLockup
      name={name}
      cutColor="var(--sidebar)"
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
    />
  );
}

export function AppShellCouple({
  names,
  meta,
  initials,
  collapsed,
}: {
  names: string;
  meta: string;
  initials: [string, string];
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <div className="flex shrink-0">
        <span className="flex size-8 items-center justify-center rounded-full border border-sidebar bg-secondary text-label font-medium text-secondary-foreground">
          {initials[0]}
        </span>
        <span className="-ml-2 flex size-8 items-center justify-center rounded-full border border-sidebar bg-primary text-label font-medium text-primary-foreground">
          {initials[1]}
        </span>
      </div>
      {!collapsed ? (
        <div className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
          <p className="truncate font-serif text-sm">{names}</p>
          <p className="truncate text-label text-muted-foreground">{meta}</p>
        </div>
      ) : null}
    </div>
  );
}
