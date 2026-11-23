import { useEffect, type ReactNode } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { SMOOTH_FAST } from "@/theme/motion";
import { impact } from "./haptics";

/** Horizontal shake — wrong password, validation error. Re-fires when `trigger` changes. */
export function Shake({ trigger, children }: { trigger: number; children: ReactNode }) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    impact();
    x.value = withSequence(
      withTiming(-10, SMOOTH_FAST),
      withTiming(10, SMOOTH_FAST),
      withTiming(-8, SMOOTH_FAST),
      withTiming(8, SMOOTH_FAST),
      withTiming(0, SMOOTH_FAST),
    );
  }, [trigger, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
