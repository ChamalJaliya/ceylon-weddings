import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { font, radius, type Theme } from "@/theme";

/** Shared field surface — used by Field, SearchField, Textarea, Select trigger. */
export function inputSurface(t: Theme, opts?: { multiline?: boolean; rounded?: "md" | "full" }): ViewStyle & TextStyle {
  return {
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.card,
    borderRadius: opts?.rounded === "full" ? radius.full : radius.md,
    color: t.heading,
    fontFamily: font.sans,
    fontSize: 16,
    ...(opts?.multiline
      ? { minHeight: 120, paddingHorizontal: 16, paddingVertical: 14, textAlignVertical: "top" as const }
      : { height: 52, paddingHorizontal: 16 }),
  };
}

export const inputStyles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center" },
});
