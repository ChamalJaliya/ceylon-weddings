import * as React from "react";
import { cn } from "../lib/utils";
import { badgeVariants, type BadgeIntent } from "../contracts/badge";

export function Badge({
  className,
  intent,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { intent?: BadgeIntent }) {
  return <span data-slot="badge" className={cn(badgeVariants({ intent }), className)} {...props} />;
}
