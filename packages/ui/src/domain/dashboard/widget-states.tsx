"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { Button } from "../../components/button";
import { Icon, type IconComponent } from "../../components/icon";
import { Skeleton } from "../../components/skeleton";
import { cn } from "../../lib/utils";
import type { WidgetPreviewKind } from "./types";

/** Calm empty state inside a chart / list widget. */
export function WidgetEmpty({
  title,
  description,
  icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("widget-empty", className)} role="status">
      <span className="widget-empty__icon" aria-hidden>
        <Icon icon={icon} size="sm" lottie={false} />
      </span>
      <p className="widget-empty__title">{title}</p>
      {description ? <p className="widget-empty__description">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** A widget whose data failed to load, with a retry. */
export function WidgetError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <WidgetEmpty
      icon={CircleAlert}
      title="Couldn't load this widget"
      description={message ?? "Check your connection and try again."}
      action={
        onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

/** Nested soft panel inside a widget. */
export function WidgetPanel({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("widget-panel", className)}>
      {title ? <div className="widget-panel__title">{title}</div> : null}
      {children}
    </div>
  );
}

/** Loading placeholder shaped like the widget that is coming. */
export function WidgetSkeleton({ kind }: { kind: WidgetPreviewKind }) {
  if (kind === "stat") {
    return (
      <div className="kpi" aria-hidden>
        <div className="kpi__body justify-between">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }
  if (kind === "donut" || kind === "ring") {
    return (
      <div className="flex h-full items-center justify-center gap-6" aria-hidden>
        <Skeleton className="aspect-square h-4/5 max-h-44 rounded-full" />
        <div className="grid w-28 gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
    );
  }
  if (kind === "list" || kind === "progress" || kind === "calendar") {
    return (
      <div className="grid gap-2.5" aria-hidden>
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className={cn("h-10 w-full rounded-xl", row === 3 && "w-3/4")} />
        ))}
      </div>
    );
  }
  if (kind === "media") return <Skeleton className="size-full rounded-xl" />;
  return (
    <div className="flex h-full items-end gap-2" aria-hidden>
      {[40, 65, 50, 80, 55, 90, 70, 60].map((height, index) => (
        <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}
