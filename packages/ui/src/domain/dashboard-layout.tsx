import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function DashboardStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="dashboard-stack" className={cn("cw-stack", className)}>
      {children}
    </div>
  );
}

export function DashboardStats({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="dashboard-stats"
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4", className)}
    >
      {children}
    </div>
  );
}

export function DashboardMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="dashboard-main"
      className={cn("grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-8", className)}
    >
      {children}
    </div>
  );
}

export function DashboardPrimary({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="dashboard-primary" className={cn("cw-section min-w-0 lg:col-span-8", className)}>
      {children}
    </div>
  );
}

export function DashboardSecondary({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="dashboard-secondary" className={cn("cw-section min-w-0 lg:col-span-4", className)}>
      {children}
    </div>
  );
}

export function DashboardGallery({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="dashboard-gallery"
      className={cn("grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4", className)}
    >
      {children}
    </div>
  );
}
