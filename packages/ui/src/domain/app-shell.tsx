"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/utils";
import { Icon, AnimateIcon } from "../components/icon";
import { IconButton } from "../components/icon-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/sheet";

type RailRender = (collapsed: boolean) => React.ReactNode;

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
  const resolve = (value: RailRender | React.ReactNode | undefined, mode: boolean) => {
    if (value == null) return null;
    return typeof value === "function" ? value(mode) : value;
  };

  const rail = (mode: boolean) => (
    <>
      <div className={cn("px-5 py-6", mode && "px-3")}>{resolve(brand, mode)}</div>
      <nav className={cn("flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4", mode && "px-2")}>
        {resolve(nav, mode)}
      </nav>
      {railFooter ? (
        <div className={cn("mt-auto border-t border-sidebar-border px-4 py-4", mode && "px-2")}>
          {resolve(railFooter, mode)}
        </div>
      ) : null}
    </>
  );

  return (
    <div data-slot="app-shell" data-collapsed={collapsed ? "true" : undefined} className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex",
          "transition-[width] duration-300 ease-out motion-reduce:transition-none",
          collapsed ? "w-[4.25rem]" : "w-[15.5rem]",
        )}
      >
        {rail(collapsed)}
        {onCollapsedChange ? (
          <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
            <IconButton
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => onCollapsedChange(!collapsed)}
              className="text-muted-foreground"
            >
              <Icon icon={collapsed ? PanelLeftOpen : PanelLeftClose} size="sm" />
            </IconButton>
          </div>
        ) : null}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="gap-0 p-0 lg:hidden" showClose>
          <SheetHeader className="sr-only">
            <SheetTitle>{mobileTitle}</SheetTitle>
            <SheetDescription>{mobileTitle}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">{rail(false)}</div>
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

export function AppShellNavGroup({
  label,
  children,
  collapsed,
}: {
  label: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div data-slot="nav-group" className="grid gap-0.5">
      {!collapsed ? (
        <p className="px-3 pb-1.5 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
      ) : (
        <div className="mx-auto mb-1 h-px w-6 bg-sidebar-border" aria-hidden />
      )}
      {children}
    </div>
  );
}

export function AppShellNavItem({
  className,
  active,
  asChild = false,
  collapsed,
  label,
  ...props
}: React.ComponentProps<"a"> & {
  active?: boolean;
  asChild?: boolean;
  collapsed?: boolean;
  label?: string;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <AnimateIcon animateOnHover animateOnTap asChild>
    <Comp
      data-slot="nav-item"
      data-active={active ? "true" : undefined}
      title={collapsed ? label ?? props.title : props.title}
      aria-label={collapsed ? label ?? props["aria-label"] : props["aria-label"]}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl py-2 text-sm text-muted-foreground transition-[color,background-color,transform] duration-200 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        collapsed ? "justify-center px-2" : "pr-3 pl-3.5",
        active && "bg-sidebar-accent/80 font-medium text-sidebar-foreground",
        active &&
          !collapsed &&
          "before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:transition-[height,opacity] before:duration-300",
        className,
      )}
      {...props}
    />
    </AnimateIcon>
  );
}

export function AppShellBrand({
  monogram = "CW",
  name,
  kicker,
  collapsed,
}: {
  monogram?: string;
  name: string;
  kicker?: string;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/35 font-serif text-sm tracking-wide text-primary">
        {monogram}
      </div>
      {!collapsed ? (
        <div className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
          {kicker ? (
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">{kicker}</p>
          ) : null}
          <p className="truncate font-serif text-base leading-tight">{name}</p>
        </div>
      ) : null}
    </div>
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
        <span className="flex size-8 items-center justify-center rounded-full border border-sidebar bg-secondary text-[10px] font-semibold text-secondary-foreground">
          {initials[0]}
        </span>
        <span className="-ml-2 flex size-8 items-center justify-center rounded-full border border-sidebar bg-primary text-[10px] font-semibold text-primary-foreground">
          {initials[1]}
        </span>
      </div>
      {!collapsed ? (
        <div className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
          <p className="truncate font-serif text-sm">{names}</p>
          <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
        </div>
      ) : null}
    </div>
  );
}
