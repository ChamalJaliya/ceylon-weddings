import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { font, radius, shadow, useTheme } from "@/theme";
import { tap } from "./haptics";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const slot = (w - 8) / options.length;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(idx * slot, SMOOTH);
  }, [idx, slot, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: "row", backgroundColor: t.inset, borderRadius: radius.full, padding: 4 }}
    >
      {w ? (
        <Reanimated.View
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: slot,
              borderRadius: radius.full,
              backgroundColor: t.card,
            },
            t.dark ? null : shadow.card,
            pill,
          ]}
        />
      ) : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => {
            tap();
            onChange(o.value);
          }}
          style={{ flex: 1, paddingVertical: 9, alignItems: "center" }}
        >
          <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: o.value === value ? t.heading : t.muted }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginRight: 8,
        paddingHorizontal: 16,
        height: 36,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: active ? t.heading : t.border,
        backgroundColor: active ? t.heading : t.card,
      }}
    >
      <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: active ? t.page : t.body }}>{label}</Text>
      {count != null ? (
        <Text style={{ fontFamily: font.sans, fontSize: 12, color: active ? t.page : t.muted, opacity: 0.8 }}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ThemedSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        tap();
        onValueChange(v);
      }}
      trackColor={{ false: t.border, true: t.primary }}
      thumbColor={t.overlay.onImageFg}
      ios_backgroundColor={t.border}
    />
  );
}
