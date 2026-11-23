import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { font, useTheme } from "@/theme";
import { tap } from "./haptics";

export type RadioOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label?: ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }} accessibilityRole="radiogroup">
      {label != null ? (
        typeof label === "string" ? (
          <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.muted, marginBottom: 2 }}>{label}</Text>
        ) : (
          label
        )
      ) : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={o.disabled}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: o.disabled }}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: selected ? t.primary : t.border,
              backgroundColor: selected ? t.accentBg : t.card,
              opacity: o.disabled ? 0.45 : 1,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                marginTop: 1,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: selected ? t.primary : t.borderStrong,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selected ? (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.primary }} />
              ) : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>{o.label}</Text>
              {o.description ? (
                <Text style={{ fontFamily: font.sans, fontSize: 13, color: t.muted, lineHeight: 18 }}>
                  {o.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
