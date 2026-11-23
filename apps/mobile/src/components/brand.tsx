import { Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { font, ornate, useTheme } from "@/theme";

/**
 * Ceylon Wedding mark — a ring crowned by a Nil Manel (water lily) with two sweeping leaves.
 * Same geometry as packages/ui/src/domain/brand-mark.tsx (source: apps/web/public/brand/ceylon-wedding-mark.svg).
 * `cutColor` must match what sits behind the mark (the fine separators between petals).
 */
const PETAL = "M0,0 C14,-16 15,-38 0,-58 C-15,-38 -14,-16 0,0Z";
const PETAL_SMALL = "M0,0 C11,-13 12,-31 0,-46 C-12,-31 -11,-13 0,0Z";
const PETALS: ReadonlyArray<readonly [string, string]> = [
  [PETAL, "rotate(-62) scale(.82)"],
  [PETAL, "rotate(62) scale(.82)"],
  [PETAL, "rotate(-40) scale(.94)"],
  [PETAL, "rotate(40) scale(.94)"],
  [PETAL, "rotate(-18)"],
  [PETAL, "rotate(18)"],
  [PETAL, "scale(1.06)"],
  [PETAL_SMALL, "rotate(-30) scale(.95)"],
  [PETAL_SMALL, "rotate(30) scale(.95)"],
  [PETAL_SMALL, "rotate(-10) scale(.9)"],
  [PETAL_SMALL, "rotate(10) scale(.9)"],
];

export function BrandMark({ height = 48, color, cutColor }: { height?: number; color?: string; cutColor?: string }) {
  const t = useTheme();
  const fill = color ?? t.primary;
  const cut = cutColor ?? t.page;
  return (
    <Svg width={(height * 220) / 250} height={height} viewBox="0 0 220 250" accessibilityLabel="Ceylon Weddings">
      <Path fill={fill} fillRule="evenodd" d="M110,98 a74,74 0 1,0 0.01,0Z M110,104 a66,69.5 0 1,0 0.01,0Z" />
      <G fill={fill} stroke={cut} strokeLinejoin="round">
        <Path strokeWidth={3} d="M108,108 C132,92 168,94 190,118 C164,112 136,114 108,108Z" />
        <Path fill="none" strokeWidth={1.6} d="M114,107 C140,104 162,106 182,114" />
        <Path strokeWidth={3} d="M112,108 C88,94 56,96 34,122 C58,114 86,115 112,108Z" />
        <Path fill="none" strokeWidth={1.6} d="M106,107 C82,105 60,108 42,118" />
        <G transform="translate(110,104)" strokeWidth={3}>
          {PETALS.map(([d, transform]) => (
            <Path key={transform} d={d} transform={transform} />
          ))}
          <Path d="M-22,-4 C-14,8 14,8 22,-4 C12,2 -12,2 -22,-4Z" />
        </G>
      </G>
    </Svg>
  );
}

/** Mark + CEYLON / WEDDINGS, like BrandLockup on the web. */
export function BrandLockup({
  size = "md",
  layout = "row",
  color,
  cutColor,
}: {
  size?: "sm" | "md" | "lg";
  layout?: "row" | "stack";
  color?: string;
  cutColor?: string;
}) {
  const t = useTheme();
  const markH = size === "lg" ? 96 : size === "md" ? 48 : 32;
  const top = size === "lg" ? 26 : size === "md" ? 20 : 14;
  const bottom = size === "lg" ? 13 : size === "md" ? 11 : 9;
  const fg = color ? color : t.heading;
  const stack = layout === "stack";
  return (
    <View
      accessible
      accessibilityLabel="Ceylon Weddings"
      style={{ flexDirection: stack ? "column" : "row", alignItems: "center", gap: stack ? 14 : 10 }}
    >
      <BrandMark height={markH} color={color} cutColor={cutColor} />
      <View style={{ alignItems: stack ? "center" : "flex-start" }}>
        <Text
          style={{
            fontFamily: font.display,
            fontSize: top,
            letterSpacing: ornate(top),
            color: fg,
            lineHeight: top * 1.05,
          }}
        >
          CEYLON
        </Text>
        <Text
          style={{
            fontFamily: font.display,
            fontSize: bottom,
            letterSpacing: ornate(bottom) * 1.35,
            color: color ? fg : t.muted,
            marginTop: 2,
          }}
        >
          WEDDINGS
        </Text>
      </View>
    </View>
  );
}
