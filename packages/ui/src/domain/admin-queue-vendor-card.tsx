"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { AdminListingPreview } from "./team-vendor";

/**
 * Shared moderation queue card (verify / Ceylon Picks).
 * Wraps `AdminListingPreview` with optional notes, failures, and action footer.
 */
export function AdminQueueVendorCard({
  name,
  category,
  location,
  photoUrl,
  photos,
  verified,
  featured,
  ready,
  failures,
  children,
  actions,
  className,
  layout = "stack",
}: {
  name: string;
  category: string;
  location: string;
  photoUrl?: string | null;
  photos?: string[] | null;
  verified?: boolean;
  featured?: boolean;
  ready?: boolean;
  failures?: string[];
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** `split` puts actions in a side column on md+. */
  layout?: "stack" | "split";
}) {
  return (
    <div
      className={cn(
        "grid gap-3 border-b border-border py-4 first:pt-1 last:border-0 last:pb-1",
        layout === "split" && "md:grid-cols-[1fr_auto] md:items-center",
        className,
      )}
      data-slot="admin-queue-vendor-card"
    >
      <div className="grid gap-2">
        <AdminListingPreview
          name={name}
          category={category}
          location={location}
          photoUrl={photoUrl}
          photos={photos}
          verified={verified}
          featured={featured}
          ready={ready}
        />
        {failures && failures.length > 0 ? (
          <ul className="text-xs text-muted-foreground">
            {failures.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminQueueVendorList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid", className)} data-slot="admin-queue-vendor-list">
      {children}
    </div>
  );
}
