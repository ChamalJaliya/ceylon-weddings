"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/** Layout chrome for couple moodboard studio. */
export function MoodboardStudioShell({
  sidebar,
  toolbar,
  children,
  className,
}: {
  sidebar?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[calc(100vh-6rem)] flex-col gap-4", className)}>
      {toolbar}
      <div className="grid flex-1 gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {sidebar ? <aside className="space-y-3">{sidebar}</aside> : null}
        <section className="flex min-h-[32rem] flex-col gap-3">{children}</section>
      </div>
    </div>
  );
}
