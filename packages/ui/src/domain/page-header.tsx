"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Icon, type IconComponent } from "../components/icon";
import { Reveal } from "./motion";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  icon,
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: IconComponent;
  className?: string;
}) {
  return (
    <Reveal
      data-slot="page-header"
      className={cn("flex flex-wrap items-start justify-between gap-5", className)}
      y={10}
    >
      <div className="flex min-w-0 items-start gap-4">
        {icon ? (
          <span className="mt-1 grid size-12 shrink-0 place-items-center rounded-2xl border border-border/60 bg-card/80 text-primary shadow-sm">
            <Icon icon={icon} size="md" animateOnView />
          </span>
        ) : null}
        <div className="min-w-0 space-y-2">
          {kicker ? (
            <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">{kicker}</p>
          ) : null}
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </Reveal>
  );
}
