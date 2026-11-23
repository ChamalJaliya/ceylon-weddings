import { Text, View } from "react-native";
import { font, useTheme } from "@/theme";

export function Avatar({ name, size = 42, tone }: { name: string; size?: number; tone?: "bride" | "groom" | "both" }) {
  const t = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const [bg, fg] =
    tone === "bride" ? [t.loveSubtle, t.love] : tone === "groom" ? [t.infoSubtle, t.info] : [t.accentBg, t.primaryText];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: font.display, fontSize: size * 0.42, color: fg }}>{initials || "·"}</Text>
    </View>
  );
}
