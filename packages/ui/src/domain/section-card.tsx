"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/card";
import { cn } from "../lib/utils";
import { AnimateIcon, Icon, type IconComponent } from "../components/icon";
import { Reveal } from "./motion";

const variantClass = {
  raised: "border-border/80 bg-card/90 shadow-sm transition-shadow duration-300 hover:shadow-card",
  muted: "border-transparent bg-secondary/35 shadow-none",
  plain: "border-transparent bg-transparent shadow-none",
} as const;

export function SectionCard({
  title,
  action,
  icon,
  children,
  className,
  delay,
  variant = "raised",
}: {
  title: ReactNode;
  action?: ReactNode;
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
  variant?: keyof typeof variantClass;
}) {
  const delaySec = delay ? delay * 0.075 : 0;

  return (
    <Reveal delay={delaySec} y={12}>
      <Card
        data-slot="section-card"
        data-variant={variant}
        elevation={variant === "raised" ? "raised" : "flat"}
        className={cn(variantClass[variant], className)}
      >
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between gap-3 space-y-0",
            variant === "plain" && "px-0 pt-0",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {icon ? (
              <AnimateIcon animateOnHover asChild>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary/70 text-muted-foreground">
                  <Icon icon={icon} size="sm" />
                </span>
              </AnimateIcon>
            ) : null}
            <CardTitle className="truncate">{title}</CardTitle>
          </div>
          {action ? <div data-slot="card-action" className="shrink-0">{action}</div> : null}
        </CardHeader>
        <CardContent className={cn("grid gap-3", variant === "plain" && "px-0 pb-0")}>{children}</CardContent>
      </Card>
    </Reveal>
  );
}
