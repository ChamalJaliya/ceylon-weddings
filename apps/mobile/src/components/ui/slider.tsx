import { useEffect, useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { font, useTheme } from "@/theme";
import { SMOOTH_FAST } from "@/theme/motion";
import { tap } from "./haptics";
import { Label } from "./label";

/** Continuous slider — drag or tap the track. Pairs with a light haptic on release. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  format = (n) => String(n),
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  format?: (n: number) => string;
}) {
  const t = useTheme();
  const [trackW, setTrackW] = useState(1);
  const x = useSharedValue(((value - min) / (max - min || 1)) * trackW);

  useEffect(() => {
    x.value = withTiming(((value - min) / (max - min || 1)) * trackW, SMOOTH_FAST);
  }, [value, min, max, trackW, x]);

  const clamp = (raw: number) => {
    const ratio = Math.max(0, Math.min(1, raw / trackW));
    const unstepped = min + ratio * (max - min);
    const stepped = Math.round(unstepped / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const commit = (rawX: number) => {
    const next = clamp(rawX);
    onChange(next);
    x.value = withTiming(((next - min) / (max - min || 1)) * trackW, SMOOTH_FAST);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = Math.max(0, Math.min(trackW, e.x));
    })
    .onEnd((e) => {
      runOnJS(tap)();
      runOnJS(commit)(e.x);
    });

  const tapG = Gesture.Tap().onEnd((e) => {
    runOnJS(tap)();
    runOnJS(commit)(e.x);
  });

  const fill = useAnimatedStyle(() => ({ width: x.value }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: Math.max(0, x.value - 12) }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackW(w);
    x.value = ((value - min) / (max - min || 1)) * w;
  };

  return (
    <View style={{ gap: 8 }}>
      {(label || true) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          {label ? <Label>{label}</Label> : <View />}
          <Text style={{ fontFamily: font.sansMedium, fontSize: 14, color: t.heading }}>{format(value)}</Text>
        </View>
      )}
      <GestureDetector gesture={Gesture.Exclusive(pan, tapG)}>
        <View onLayout={onLayout} style={{ height: 32, justifyContent: "center" }} accessibilityRole="adjustable">
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.inset, overflow: "hidden" }}>
            <Animated.View style={[{ height: "100%", backgroundColor: t.primary, borderRadius: 3 }, fill]} />
          </View>
          <Animated.View
            style={[
              {
                position: "absolute",
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: t.card,
                borderWidth: 2,
                borderColor: t.primary,
                top: 4,
              },
              thumb,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
