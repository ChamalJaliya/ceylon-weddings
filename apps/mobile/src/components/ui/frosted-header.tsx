import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { type AnimatedStyle } from "react-native-reanimated";
import { font, useTheme } from "@/theme";

/**
 * Compact frosted title bar that fades in as the large title scrolls away.
 * Pass a Reanimated opacity style (typically from scroll interpolate).
 */
export function FrostedHeader({
  title,
  animatedStyle,
  height = 48,
  right,
}: {
  title: string;
  animatedStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  height?: number;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          zIndex: 5,
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + height,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.border,
          overflow: "hidden",
        },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={70}
        tint={t.dark ? "dark" : "light"}
        style={{
          flex: 1,
          paddingTop: insets.top,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.dark ? t.overlay.frostDark : t.overlay.frostLight,
        }}
      >
        <Text style={{ fontFamily: font.display, fontSize: 21, color: t.heading }}>{title}</Text>
        {right ? (
          <View style={{ position: "absolute", right: 16, top: insets.top, bottom: 0, justifyContent: "center" }}>
            {right}
          </View>
        ) : null}
      </BlurView>
    </Reanimated.View>
  );
}
