import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";
import { Body } from "./typography";

export function Spinner({
  size = "md",
  label,
  style,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const dim = size === "sm" ? "small" : "large";
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", gap: 10, padding: 20 }, style]}>
      <ActivityIndicator size={dim} color={t.primary} />
      {label ? (
        <Body muted size={13}>
          {label}
        </Body>
      ) : null}
    </View>
  );
}
