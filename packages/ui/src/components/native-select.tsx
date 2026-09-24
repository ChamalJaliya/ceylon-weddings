import * as React from "react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";
import { nativeSelectVariants } from "../contracts/native-select";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      data-slot="native-select"
      className={cn(fieldVariants(), nativeSelectVariants(), className)}
      ref={ref}
      {...props}
    />
  ),
);
NativeSelect.displayName = "NativeSelect";
