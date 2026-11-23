import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { font, radius, useTheme } from "@/theme";
import { SMOOTH, SMOOTH_FAST } from "@/theme/motion";
import { Touchable } from "./button";
import { success as hapticSuccess, tap } from "./haptics";

type Phase = "idle" | "loading" | "success";

/**
 * Button that morphs idle → spinner → checkmark, then resets.
 * Use for form submits where confirmation should feel physical.
 */
export function MorphButton({
  label,
  onPress,
  disabled,
  successLabel = "Done",
  variant = "primary",
}: {
  label: string;
  onPress: () => Promise<void> | void;
  disabled?: boolean;
  successLabel?: string;
  variant?: "primary" | "dark";
}) {
  const t = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");
  const scale = useSharedValue(1);

  useEffect(() => {
    if (phase !== "success") return;
    const id = setTimeout(() => setPhase("idle"), 1400);
    return () => clearTimeout(id);
  }, [phase]);

  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = variant === "primary" ? t.primary : t.heading;
  const fg = variant === "primary" ? t.primaryFg : t.page;

  const run = async () => {
    if (phase !== "idle") return;
    tap();
    setPhase("loading");
    try {
      await onPress();
      hapticSuccess();
      scale.value = withSequence(withTiming(1.06, SMOOTH_FAST), withTiming(1, SMOOTH));
      setPhase("success");
    } catch {
      setPhase("idle");
    }
  };

  let content: ReactNode = <Text style={{ color: fg, fontFamily: font.sansMedium, fontSize: 16 }}>{label}</Text>;
  if (phase === "loading") content = <ActivityIndicator color={fg} />;
  if (phase === "success") {
    content = (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Check size={18} color={fg} strokeWidth={3} />
        <Text style={{ color: fg, fontFamily: font.sansMedium, fontSize: 16 }}>{successLabel}</Text>
      </View>
    );
  }

  return (
    <Touchable
      onPress={run}
      disabled={disabled || phase !== "idle"}
      haptic={false}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        height: 54,
        borderRadius: radius.full,
        backgroundColor: phase === "success" ? t.success : bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 22,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Animated.View style={a}>{content}</Animated.View>
    </Touchable>
  );
}
