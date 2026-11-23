import { Text, View } from "react-native";
import { font, radius, useTheme } from "@/theme";

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "gold" | "love";
}) {
  const t = useTheme();
  const map = {
    neutral: [t.inset, t.body],
    success: [t.successSubtle, t.success],
    warning: [t.warningSubtle, t.warning],
    danger: [t.dangerSubtle, t.danger],
    info: [t.infoSubtle, t.info],
    gold: [t.accentBg, t.primaryText],
    love: [t.loveSubtle, t.love],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: fg, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}
