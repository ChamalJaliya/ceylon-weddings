import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { font, ornate, useTheme } from "@/theme";

export function Display({
  children,
  size = 34,
  style,
  color,
}: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
  color?: string;
}) {
  const t = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.display,
          fontSize: size,
          lineHeight: size * 1.08,
          letterSpacing: -size * 0.015,
          color: color ?? t.heading,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Eyebrow({
  children,
  color,
  style,
  size = 11,
}: {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: font.sansMedium,
          fontSize: size,
          letterSpacing: ornate(size),
          color: color ?? t.muted,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  size = 15,
  style,
  numberOfLines,
  medium,
}: {
  children: ReactNode;
  muted?: boolean;
  size?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  medium?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: medium ? font.sansMedium : font.sans,
          fontSize: size,
          lineHeight: size * 1.5,
          color: muted ? t.muted : t.body,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
