"use client";

import type { ReactNode } from "react";
import { AnimateIcon, Icon, type IconComponent } from "../components/icon";
import { cn } from "../lib/utils";
import { motion, useReducedMotion, AnimatedCounter, SPRING_SNAPPY } from "./motion";

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon: IconComponent;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "love" | "info";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const toneClass = {
    default: "bg-accent text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    love: "bg-love/15 text-love",
    info: "bg-info/15 text-info",
  }[tone];

  return (
    <AnimateIcon animateOnHover animateOnView asChild>
    <motion.div
      data-slot="stat-card"
      className={cn(
        "rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300",
        "hover:border-border hover:shadow-card",
        className,
      )}
      whileHover={reduce ? undefined : { y: -3, scale: 1.01 }}
      transition={SPRING_SNAPPY}
    >
      <div className="flex items-start gap-3.5">
        <div className={cn("flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105", toneClass)}>
          <Icon icon={icon} size="md" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</p>
          <div className="mt-1.5 font-serif text-3xl font-semibold leading-none tracking-tight">
            {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
          </div>
          {hint ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </motion.div>
    </AnimateIcon>
  );
}

