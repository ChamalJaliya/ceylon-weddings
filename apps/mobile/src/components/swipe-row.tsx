import { useRef, type ReactNode } from "react";
import { Text, View } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { impact } from "./ui";
import { font, useTheme } from "@/theme";

export type SwipeAction = { label: string; icon: ReactNode; color: string; onAction: () => void };

function ActionPanel({ drag, action }: { drag: SharedValue<number>; action: SwipeAction; side: "left" | "right" }) {
  const t = useTheme();
  const style = useAnimatedStyle(() => {
    const d = Math.abs(drag.value);
    return {
      opacity: interpolate(d, [0, 40, 80], [0, 0.6, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 90, 140], [0.6, 1, 1.12], Extrapolation.CLAMP) }],
    };
  });
  return (
    <View style={{ width: 96, backgroundColor: action.color, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ alignItems: "center", gap: 4 }, style]}>
        {action.icon}
        <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: t.overlay.onImageFg }}>{action.label}</Text>
      </Animated.View>
    </View>
  );
}

/** Row with full-swipe actions: swipe right for `left`, swipe left for `right`. Fires on release past the threshold. */
export function SwipeRow({ children, left, right }: { children: ReactNode; left?: SwipeAction; right?: SwipeAction }) {
  const ref = useRef<SwipeableMethods>(null);
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      overshootFriction={8}
      leftThreshold={70}
      rightThreshold={70}
      renderLeftActions={left ? (_p, drag) => <ActionPanel drag={drag} action={left} side="left" /> : undefined}
      renderRightActions={right ? (_p, drag) => <ActionPanel drag={drag} action={right} side="right" /> : undefined}
      onSwipeableOpen={(dir) => {
        impact();
        const a = dir === "left" ? right : left;
        setTimeout(() => ref.current?.close(), 120);
        a?.onAction();
      }}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
