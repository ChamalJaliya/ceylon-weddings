"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function AdminDataTable({
  headers,
  children,
  className,
}: {
  headers: ReactNode[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/60", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="border-b border-border/60 bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-3 py-2.5 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminDataRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "cw-row-lift bg-background/40 transition-colors hover:bg-secondary/20",
        onClick ? "cursor-pointer" : null,
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function AdminDataCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-middle", className)}>{children}</td>;
}
