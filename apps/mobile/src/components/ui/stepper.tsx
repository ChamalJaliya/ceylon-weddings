import { Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { font, useTheme } from "@/theme";
import { IconButton } from "./button";
import { impact, tap } from "./haptics";
import { Body } from "./typography";
import { Label } from "./label";

/** Quantity stepper — preferred over typing a number for small ranges. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  hint,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
  hint?: string;
}) {
  const t = useTheme();
  const dec = () => {
    if (value <= min) return;
    tap();
    onChange(value - 1);
  };
  const inc = () => {
    if (value >= max) return;
    impact();
    onChange(value + 1);
  };
  return (
    <View style={{ gap: 8 }}>
      {label ? <Label>{label}</Label> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          {hint ? (
            <Body muted size={13}>
              {hint}
            </Body>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconButton label="Decrease" onPress={dec}>
            <Minus size={16} color={value <= min ? t.borderStrong : t.heading} />
          </IconButton>
          <Text style={{ fontFamily: font.display, fontSize: 28, color: t.heading, minWidth: 28, textAlign: "center" }}>
            {value}
          </Text>
          <IconButton label="Increase" onPress={inc}>
            <Plus size={16} color={value >= max ? t.borderStrong : t.heading} />
          </IconButton>
        </View>
      </View>
    </View>
  );
}
