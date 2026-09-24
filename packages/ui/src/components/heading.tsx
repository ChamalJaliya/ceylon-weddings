"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { headingIconSizeMap, headingVariants, type HeadingLevel } from "../contracts/heading";
import { Icon, type IconComponent } from "./icon";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  icon?: IconComponent;
}

export { headingVariants };
export type { HeadingLevel };

export function Heading({ as = "h2", icon, className, children, ...props }: HeadingProps) {
  const Comp = as;
  return (
    <Comp
      data-slot="heading"
      className={cn("group flex items-center gap-2.5", headingVariants({ level: as }), className)}
      {...props}
    >
      {icon ? <Icon icon={icon} size={headingIconSizeMap[as]} lottie={false} className="text-primary" /> : null}
      {children}
    </Comp>
  );
}
