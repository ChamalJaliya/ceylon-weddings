import type { ReactNode } from "react";
import { View, type RefreshControlProps, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Menu as MenuIcon, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/theme";
import { useDrawer } from "../drawer";
import { IconButton } from "./button";
import { FrostedHeader } from "./frosted-header";
import { Body, Display, Eyebrow } from "./typography";

/**
 * iOS-style large-title screen: the serif title shrinks into a frosted compact header as you scroll.
 */
export function Screen({
  eyebrow: kicker,
  title,
  subtitle,
  right,
  children,
  refreshControl,
  contentStyle,
  bottomSpace = 120,
  nav = "menu",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  bottomSpace?: number;
  /** "menu" opens the side nav (tab screens); "back" pops (pushed screens). */
  nav?: "menu" | "back";
}) {
  const t = useTheme();
  const drawer = useDrawer();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const compact = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [40, 80], [0, 1], Extrapolation.CLAMP) }));
  const large = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(y.value, [-120, 0], [1.12, 1], Extrapolation.CLAMP) },
      { translateY: interpolate(y.value, [0, 80], [0, -10], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <FrostedHeader title={title} animatedStyle={compact} />
      <Reanimated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentContainerStyle={[
          { paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: bottomSpace },
          contentStyle,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <IconButton
            label={nav === "menu" ? "Open menu" : "Back"}
            onPress={() => (nav === "menu" ? drawer.open() : router.back())}
          >
            {nav === "menu" ? <MenuIcon size={19} color={t.heading} /> : <ChevronLeft size={21} color={t.heading} />}
          </IconButton>
          {right}
        </View>
        <Reanimated.View
          style={[{ flexDirection: "row", alignItems: "flex-end", marginBottom: 22, transformOrigin: "left" }, large]}
        >
          <View style={{ flex: 1 }}>
            {kicker ? <Eyebrow style={{ marginBottom: 6 }}>{kicker}</Eyebrow> : null}
            <Display size={40}>{title}</Display>
            {subtitle ? (
              <Body muted style={{ marginTop: 4 }}>
                {subtitle}
              </Body>
            ) : null}
          </View>
        </Reanimated.View>
        {children}
      </Reanimated.ScrollView>
    </View>
  );
}
