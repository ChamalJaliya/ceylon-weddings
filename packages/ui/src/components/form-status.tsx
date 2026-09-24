import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function FormStatus({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "destructive";
  className?: string;
}) {
  return (
    <p
      data-slot="form-status"
      role="status"
      className={cn(
        "rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
        tone === "muted" && "border-border/70 bg-muted/50 text-muted-foreground",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
    >
      {children}
    </p>
  );
}
