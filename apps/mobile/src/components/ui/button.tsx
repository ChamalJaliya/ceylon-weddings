import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { font, radius, useTheme } from "@/theme";
import { tap } from "./haptics";

/** Pressable that springs down on touch — the "feel" of the web's hover lift. */
export function Touchable({
  children,
  style,
  onPress,
  haptic = true,
  scaleTo = 0.965,
  ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  scaleTo?: number;
  children: ReactNode;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      {...rest}
      onPressIn={() => {
        s.value = withTiming(scaleTo, SMOOTH);
      }}
      onPressOut={() => {
        s.value = withTiming(1, SMOOTH);
      }}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
    >
      <Reanimated.View style={[style, a]}>{children}</Reanimated.View>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  size = "lg",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "dark";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: "md" | "lg";
}) {
  const t = useTheme();
  const bg = variant === "primary" ? t.primary : variant === "dark" ? t.heading : "transparent";
  const fg =
    variant === "primary" ? t.primaryFg : variant === "dark" ? t.page : variant === "ghost" ? t.primaryText : t.heading;
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        {
          height: size === "lg" ? 54 : 44,
          backgroundColor: bg,
          borderColor: variant === "outline" ? t.borderStrong : bg,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon}
          <Text
            style={{ color: fg, fontFamily: font.sansMedium, fontSize: size === "lg" ? 16 : 14, letterSpacing: 0.2 }}
          >
            {label}
          </Text>
        </View>
      )}
    </Touchable>
  );
}

export function IconButton({
  children,
  onPress,
  label,
  tone = "card",
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  tone?: "card" | "glass";
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tone === "glass" ? t.overlay.glassFill : t.card,
        borderWidth: 1,
        borderColor: tone === "glass" ? t.overlay.glassBorder : t.border,
      }}
    >
      {children}
    </Touchable>
  );
}

/** Frosted circle control for photo / hero chrome. */
export function GlassButton({
  children,
  onPress,
  label,
  size = 40,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: t.overlay.glassBorder,
      }}
    >
      <BlurView
        intensity={50}
        tint="dark"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.overlay.quickAction }}
      >
        {children}
      </BlurView>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
});
