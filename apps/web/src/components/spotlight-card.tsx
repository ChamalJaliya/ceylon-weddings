"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { cn } from "@ceylonweddings/ui/utils";

/** Card with a cursor-following glow and an icon that fills on hover. */
export function SpotlightCard({
  icon,
  title,
  body,
  children,
  className,
}: {
  icon?: LucideIcon;
  title?: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  return (
    <div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPos({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      className={cn(
        "group relative isolate h-full overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-primary/40 hover:shadow-raised",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(260px circle at ${pos.x}% ${pos.y}%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 70%)`,
        }}
      />
      {icon ? (
        <span className="mb-5 inline-grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-6 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon icon={icon} size="md" lottie={false} />
        </span>
      ) : null}
      {title ? <h3 className="mb-2 font-serif text-2xl font-medium">{title}</h3> : null}
      {body ? <div className="text-sm leading-relaxed text-muted-foreground">{body}</div> : null}
      {children}
    </div>
  );
}
