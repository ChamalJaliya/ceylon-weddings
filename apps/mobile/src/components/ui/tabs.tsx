import { useEffect, useState, type ReactNode } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import type { LucideIcon } from "lucide-react-native";
import { font, radius, shadow, useTheme } from "@/theme";
import { tap } from "./haptics";

export type TabItem<T extends string = string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
};

/**
 * Horizontal tabs with a springing indicator — mobile counterpart to web HorizontalTabs.
 * `pill` = rounded track (default); `underline` = hairline indicator under the active tab.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = "pill",
  size = "md",
  fill = false,
  scrollable = false,
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  variant?: "pill" | "underline";
  size?: "sm" | "md";
  /** Equal-width tabs that fill the row. */
  fill?: boolean;
  scrollable?: boolean;
}) {
  const t = useTheme();
  const idx = Math.max(
    0,
    items.findIndex((i) => i.id === value),
  );
  const [layouts, setLayouts] = useState<{ x: number; w: number }[]>([]);
  const left = useSharedValue(0);
  const width = useSharedValue(0);

  useEffect(() => {
    const L = layouts[idx];
    if (!L) return;
    left.value = withTiming(L.x, SMOOTH);
    width.value = withTiming(L.w, SMOOTH);
  }, [idx, layouts, left, width]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: left.value }],
    width: width.value,
  }));

  const onItemLayout = (i: number, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const next = [...prev];
      next[i] = { x, w };
      return next;
    });
  };

  const padY = size === "sm" ? 8 : 11;
  const fontSize = size === "sm" ? 12 : 13;

  const row = (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: variant === "pill" ? t.inset : "transparent",
        borderRadius: variant === "pill" ? radius.full : 0,
        padding: variant === "pill" ? 4 : 0,
        borderBottomWidth: variant === "underline" ? 1 : 0,
        borderBottomColor: t.border,
        position: "relative",
      }}
    >
      {variant === "pill" && layouts[idx] ? (
        <Reanimated.View
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 0,
              borderRadius: radius.full,
              backgroundColor: t.card,
            },
            t.dark ? null : shadow.card,
            indicator,
          ]}
        />
      ) : null}
      {variant === "underline" && layouts[idx] ? (
        <Reanimated.View
          style={[
            {
              position: "absolute",
              bottom: -1,
              left: 0,
              height: 2,
              borderRadius: 1,
              backgroundColor: t.primary,
            },
            indicator,
          ]}
        />
      ) : null}
      {items.map((item, i) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.id}
            disabled={item.disabled}
            onLayout={(e) => onItemLayout(i, e)}
            onPress={() => {
              tap();
              onChange(item.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: item.disabled }}
            style={{
              flex: fill ? 1 : undefined,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: padY,
              paddingHorizontal: fill ? 8 : 16,
              opacity: item.disabled ? 0.4 : 1,
              zIndex: 1,
            }}
          >
            {Icon ? <Icon size={size === "sm" ? 14 : 16} color={active ? t.heading : t.muted} /> : null}
            <Text style={{ fontFamily: font.sansMedium, fontSize, color: active ? t.heading : t.muted }}>
              {item.label}
            </Text>
            {item.badge != null ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 5,
                  backgroundColor: active ? t.primary : t.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontFamily: font.sansMedium, fontSize: 10, color: active ? t.primaryFg : t.muted }}>
                  {item.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (scrollable && !fill) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {row}
      </ScrollView>
    );
  }
  return row;
}

export function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return null;
  return <View style={{ marginTop: 16 }}>{children}</View>;
}
