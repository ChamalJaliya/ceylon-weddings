import type { ComponentType, SVGProps } from "react";

export const ICON_STROKE = 1.5;

export const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof iconSizeMap;

export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number }
>;

export const buttonIconSizeMap = {
  sm: "xs",
  default: "sm",
  lg: "md",
  icon: "sm",
} as const;
