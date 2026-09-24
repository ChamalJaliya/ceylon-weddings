"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "icon", variant = "ghost", shape = "pill", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      shape={shape}
      className={cn("size-9 shrink-0", className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
