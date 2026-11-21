"use client";

import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { Icon, type IconComponent } from "../components/icon";
import { Reveal } from "./motion";

/**
 * `kind="empty"` (default): nothing exists yet — pass the create action.
 * `kind="no-results"`: filters/search matched nothing — defaults to a search
 * icon and a "Clear filters" button when `onClearFilters` is given.
 * Pair with getListEmptyMode / showListChrome from `@ceylonweddings/ui/lib/list-state`.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  kind = "empty",
  onClearFilters,
  clearFiltersLabel = "Clear filters",
  className,
}: {
  icon?: IconComponent;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  kind?: "empty" | "no-results";
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
  className?: string;
}) {
  const noResults = kind === "no-results";
  const resolvedIcon = icon ?? (noResults ? SearchX : undefined);
  const resolvedTitle = title ?? (noResults ? "No matches" : "Nothing here yet");
  const resolvedDescription =
    description ?? (noResults ? "Try a different search or clear your filters." : undefined);
  const resolvedAction =
    action ??
    (noResults && onClearFilters ? (
      <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
        {clearFiltersLabel}
      </Button>
    ) : null);
  return (
    <Reveal
      data-slot="empty-state"
      data-kind={kind}
      className={cn(
        "grid place-items-center gap-4 rounded-3xl border border-dashed border-border/70 bg-secondary/20 px-6 py-14 text-center",
        className,
      )}
      y={12}
      whileInView={undefined}
      animate={{ opacity: 1, x: 0, y: 0 }}
    >
      {resolvedIcon ? (
        <div className="grid size-14 place-items-center rounded-full border border-border/60 bg-card/80 text-muted-foreground shadow-sm">
          <Icon icon={resolvedIcon} size="md" animateOnView />
        </div>
      ) : null}
      <div className="grid max-w-sm gap-2">
        <p className="font-serif text-xl tracking-tight">{resolvedTitle}</p>
        {resolvedDescription ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{resolvedDescription}</p>
        ) : null}
      </div>
      {resolvedAction ? <div className="mt-1">{resolvedAction}</div> : null}
    </Reveal>
  );
}
