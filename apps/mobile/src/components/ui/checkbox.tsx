import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { font, radius, useTheme } from "@/theme";
import { tap } from "./haptics";

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, opacity: disabled ? 0.45 : 1 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          marginTop: 1,
          borderRadius: radius.xs,
          borderWidth: 1.5,
          borderColor: checked ? t.primary : t.borderStrong,
          backgroundColor: checked ? t.primary : t.card,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Check size={14} color={t.primaryFg} strokeWidth={3} /> : null}
      </View>
      {label != null || description ? (
        <View style={{ flex: 1, gap: 2 }}>
          {label != null ? (
            typeof label === "string" ? (
              <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }}>{label}</Text>
            ) : (
              label
            )
          ) : null}
          {description ? (
            <Text style={{ fontFamily: font.sans, fontSize: 13, color: t.muted, lineHeight: 18 }}>{description}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
