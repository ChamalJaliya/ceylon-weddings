import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { shadow, useTheme } from "@/theme";
import { useReducedMotion } from "@/theme/motion";
import { Touchable } from "./button";
import { impact } from "./haptics";

/** Floating action button — one primary action, thumb-friendly. */
export function Fab({
  onPress,
  label = "Add",
  icon,
  bottom = 24,
}: {
  onPress: () => void;
  label?: string;
  icon?: ReactNode;
  bottom?: number;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={reduced ? FadeIn.duration(160) : ZoomIn.delay(280).springify().damping(14)}
      style={[
        {
          position: "absolute",
          right: 22,
          bottom: insets.bottom + bottom,
        },
        shadow.raised,
      ]}
    >
      <Touchable
        onPress={() => {
          impact();
          onPress();
        }}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: t.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon ?? <Plus size={26} color={t.primaryFg} />}
      </Touchable>
    </Animated.View>
  );
}
