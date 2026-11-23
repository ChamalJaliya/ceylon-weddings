import type { ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { font, ornate, useTheme } from "@/theme";

/** Form label — uppercase tracked eyebrow style, matching Field labels. */
export function Label({
  children,
  optional,
  style,
  size = 10,
}: {
  children: ReactNode;
  optional?: boolean;
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
          color: t.muted,
          textTransform: "uppercase",
        },
        style,
      ]}
    >
      {children}
      {optional ? <Text style={{ color: t.borderStrong, letterSpacing: 0 }}> · optional</Text> : null}
    </Text>
  );
}

export function HelperText({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "danger" | "success";
}) {
  const t = useTheme();
  const color = tone === "danger" ? t.danger : tone === "success" ? t.success : t.muted;
  return <Text style={{ fontFamily: font.sans, fontSize: 12, lineHeight: 17, color, marginTop: 4 }}>{children}</Text>;
}
