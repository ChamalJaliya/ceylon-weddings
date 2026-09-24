"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Icon, type IconComponent } from "../components/icon";
import { Reveal } from "./motion";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconComponent;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      data-slot="empty-state"
      className={cn(
        "grid place-items-center gap-4 rounded-3xl border border-dashed border-border/70 bg-secondary/20 px-6 py-14 text-center",
        className,
      )}
      y={12}
      whileInView={undefined}
      animate={{ opacity: 1, x: 0, y: 0 }}
    >
      {icon ? (
        <div className="grid size-14 place-items-center rounded-full border border-border/60 bg-card/80 text-muted-foreground shadow-sm">
          <Icon icon={icon} size="md" animateOnView />
        </div>
      ) : null}
      <div className="grid max-w-sm gap-2">
        <p className="font-serif text-xl tracking-tight">{title}</p>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </Reveal>
  );
}
