"use client";

/**
 * HorizontalTabs — ported from Kloqra (`@kloqra/ui` horizontal-tabs).
 *
 * A rounded pill track with a primary-coloured indicator that springs between
 * tabs. Supports icons, badges, link tabs (`href`), `inline` (hug content) or
 * `fill` (equal widths), and an optional `actions` slot on the right.
 *
 *   <HorizontalTabs
 *     ariaLabel="Consultations"
 *     items={[{ id: "bookings", label: "Bookings", icon: CalendarCheck, badge: 3 }, …]}
 *     activeId={tab}
 *     onChange={setTab}
 *   />
 */

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";
import { SPRING_SNAPPY } from "../motion/tokens";
import type { IconComponent } from "./icon";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: IconComponent;
  badge?: string | number | React.ReactNode;
  /** Render the tab as a link (e.g. route-based tabs). */
  href?: string;
  disabled?: boolean;
}

export interface HorizontalTabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  activeId: T;
  onChange?: (id: T) => void;
  ariaLabel: string;
  /** `inline` hugs its content; `fill` stretches tabs to equal widths. */
  variant?: "inline" | "fill";
  size?: "default" | "sm";
  className?: string;
  tabClassName?: string;
  /** Rendered on the right of the track (wraps below on narrow screens). */
  actions?: React.ReactNode;
  /** Custom link component (e.g. the locale-aware next-intl `Link`). */
  linkComponent?: React.ElementType;
}

export function HorizontalTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  variant = "inline",
  size = "default",
  className,
  tabClassName,
  actions,
  linkComponent: LinkComponent = "a",
}: HorizontalTabsProps<T>) {
  const navRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, top: 0, ready: false });
  const activeIndex = items.findIndex((item) => item.id === activeId);

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    if (!nav || activeIndex < 0) {
      setIndicator((prev) => ({ ...prev, width: 0, ready: false }));
      return;
    }
    const activeTab = nav.querySelectorAll<HTMLElement>("[data-tab-item]")[activeIndex];
    if (!activeTab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicator({
      // Absolute children are positioned from the padding box, so drop the nav border.
      left: tabRect.left - navRect.left - nav.clientLeft + nav.scrollLeft,
      top: tabRect.top - navRect.top - nav.clientTop + nav.scrollTop,
      width: tabRect.width,
      height: tabRect.height,
      ready: true,
    });
  }, [activeIndex]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => updateIndicator());
    return () => cancelAnimationFrame(frame);
  }, [activeId, items, variant, size, updateIndicator]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.addEventListener("scroll", updateIndicator, { passive: true });
    if (typeof ResizeObserver === "undefined") {
      return () => nav.removeEventListener("scroll", updateIndicator);
    }
    const ro = new ResizeObserver(() => requestAnimationFrame(() => updateIndicator()));
    ro.observe(nav);
    // Tabs can change width without the nav resizing (web fonts swapping in, labels changing),
    // so watch every tab too and re-measure once fonts are ready.
    nav.querySelectorAll<HTMLElement>("[data-tab-item]").forEach((tab) => ro.observe(tab));
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(() => updateIndicator());
      });
    }
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelled = true;
      ro.disconnect();
      nav.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator, items]);

  // Arrow-key navigation between tabs (roving focus).
  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const tabs = Array.from(navRef.current?.querySelectorAll<HTMLElement>("[data-tab-item]:not([disabled])") ?? []);
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    event.preventDefault();
    const next = tabs[(current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next?.focus();
  }

  const sm = size === "sm";

  const nav = (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex overflow-x-auto rounded-full border border-border/70 bg-muted/60 p-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        variant === "inline" ? "w-max max-w-full gap-1" : "w-full gap-1",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute z-0 rounded-full bg-primary shadow-sm"
        initial={false}
        animate={{
          left: indicator.left,
          top: indicator.top,
          width: Math.max(indicator.width, 0),
          height: Math.max(indicator.height, 0),
          opacity: indicator.ready ? 1 : 0,
        }}
        transition={reducedMotion ? { duration: 0 } : SPRING_SNAPPY}
      />

      {items.map((item) => {
        const isActive = item.id === activeId;
        const ItemIcon = item.icon;

        const sharedClasses = cn(
          "group relative z-[1] inline-flex items-center justify-center whitespace-nowrap rounded-full outline-none",
          sm ? "gap-1.5 px-3 py-1 text-xs" : "gap-1.5 px-3.5 py-2 text-sm sm:gap-2 sm:px-4",
          "transition-[color,transform] duration-200",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-[0.97] motion-reduce:active:scale-100",
          variant === "fill" ? "flex-1 text-center" : "shrink-0",
          isActive ? "font-medium text-primary-foreground" : "font-medium text-muted-foreground hover:text-foreground",
          item.disabled && "pointer-events-none opacity-50",
          tabClassName,
        );

        const content = (
          <>
            {ItemIcon ? (
              <ItemIcon
                className={cn(
                  "shrink-0 transition-[color,transform] duration-200",
                  sm ? "size-3.5" : "size-4",
                  isActive
                    ? "scale-110 text-primary-foreground"
                    : "text-muted-foreground group-hover:scale-105 group-hover:text-foreground",
                )}
                aria-hidden
              />
            ) : null}
            <span className="relative">{item.label}</span>
            {item.badge !== undefined && item.badge !== null && item.badge !== "" ? (
              <span
                className={cn(
                  "ml-0.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs leading-none font-medium",
                  "transition-[background-color,color,transform] duration-200",
                  isActive
                    ? "scale-110 bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-background/80 group-hover:text-foreground",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </>
        );

        if (item.href && !item.disabled) {
          return (
            <LinkComponent
              key={item.id}
              href={item.href}
              data-tab-item=""
              className={sharedClasses}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </LinkComponent>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            data-tab-item=""
            disabled={item.disabled}
            aria-current={isActive ? "page" : undefined}
            aria-pressed={isActive}
            onClick={() => onChange?.(item.id)}
            className={sharedClasses}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );

  if (!actions) return nav;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {nav}
      {actions}
    </div>
  );
}
