import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { font, radius, shadow, useTheme } from "@/theme";
import { tap } from "./haptics";
import { Display } from "./typography";

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ marginTop: 30 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <Display size={24}>{title}</Display>
        {action ? (
          <Pressable
            onPress={() => {
              tap();
              onAction?.();
            }}
            hitSlop={10}
          >
            <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.primaryText }}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        t.dark ? null : shadow.card,
        { backgroundColor: t.card, borderColor: t.border, padding: padded ? 18 : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg },
});
