/**
 * Motion kit — Reanimated 4 primitives used across the app.
 * Everything runs on the UI thread; JS only sets targets.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Dimensions, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { MOTION_FAST_MS, MOTION_MS, SMOOTH, useReducedMotion } from "@/theme/motion";
import Svg, { Circle, G } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Staggered entrance for list items / sections. Honors Reduce Motion. */
export function Rise({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const delay = Math.min(index, 10) * (reduced ? 0 : 55);
  return (
    <Animated.View
      entering={reduced ? FadeIn.duration(MOTION_FAST_MS) : FadeInDown.delay(delay).duration(MOTION_MS)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/** Number that counts up to `value` with an ease-out curve. */
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  style,
  duration = 900,
}: {
  value: number;
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <Text style={style}>{format(shown)}</Text>;
}

/** Circular progress ring. */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  color,
  track,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, value || 0)), { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.inset} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? t.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            animatedProps={props}
          />
        </G>
      </Svg>
      {children}
    </View>
  );
}

/** Donut chart with animated segments sweeping in. */
export function Donut({
  segments,
  size = 160,
  stroke = 16,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [total, p]);
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.inset} strokeWidth={stroke} fill="none" />
          {segments
            .filter((s) => s.value > 0)
            .map((s, i) => {
              const start = acc / total;
              acc += s.value;
              const len = (s.value / total) * c;
              return (
                <DonutSeg
                  key={i}
                  c={c}
                  r={r}
                  size={size}
                  stroke={stroke}
                  color={s.color}
                  len={len}
                  start={start}
                  p={p}
                />
              );
            })}
        </G>
      </Svg>
      {children}
    </View>
  );
}

function DonutSeg({
  c,
  r,
  size,
  stroke,
  color,
  len,
  start,
  p,
}: {
  c: number;
  r: number;
  size: number;
  stroke: number;
  color: string;
  len: number;
  start: number;
  p: { value: number };
}) {
  const gap = Math.min(3, len * 0.3);
  const props = useAnimatedProps(() => {
    const visible = Math.max(0, Math.min(len - gap, (p.value - start) * c));
    return { strokeDasharray: `${visible} ${c}` };
  });
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      fill="none"
      strokeDashoffset={-start * c}
      animatedProps={props}
    />
  );
}

/** Horizontal bar that springs to its value. */
export function Bar({
  value,
  color,
  height = 6,
  track,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const t = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(120, withTiming(Math.max(0, Math.min(1, value || 0)), SMOOTH));
  }, [value, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? t.inset, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", borderRadius: height, backgroundColor: color ?? t.primary }, style]} />
    </View>
  );
}

/** Shimmering placeholder block. */
export function Shimmer({
  height = 16,
  width = "100%",
  r = 8,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    x.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [x, reduced]);
  const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [0, 1], [-300, 400]) }] }));
  return (
    <View style={[{ height, width, borderRadius: r, backgroundColor: t.inset, overflow: "hidden" }, style]}>
      {reduced ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, { width: 220 }, sweep]}>
          <LinearGradient
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
            colors={["transparent", t.dark ? "rgba(255,255,255,0.05)" : "rgba(255,254,251,0.75)", "transparent"]}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Heart that pops in the middle of an image on double-tap. */
export function HeartPop({ trigger, color }: { trigger: number; color: string }) {
  const s = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    s.value = 0;
    s.value = withSequence(withTiming(1.08, SMOOTH), withDelay(350, withTiming(0, { duration: 220 })));
  }, [trigger, s]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value * 1.5), transform: [{ scale: s.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }, style]}
    >
      <Text style={{ fontSize: 86, color, textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 12 }}>♥</Text>
    </Animated.View>
  );
}

/* ── Confetti ──────────────────────────────────────────────────────────── */

const { width: SW, height: SH } = Dimensions.get("window");

function Piece({
  color,
  delay,
  x,
  drift,
  spin,
  size,
  shape,
}: {
  color: string;
  delay: number;
  x: number;
  drift: number;
  spin: number;
  size: number;
  shape: "rect" | "dot";
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withTiming(1, { duration: 2400 + Math.random() * 900, easing: Easing.out(Easing.quad) }),
    );
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.05, 0.8, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: x + Math.sin(p.value * 6) * drift },
      { translateY: interpolate(p.value, [0, 1], [-40, SH * 0.85]) },
      { rotate: `${p.value * spin}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: shape === "rect" ? size * 0.45 : size,
          borderRadius: shape === "dot" ? size : 1,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** Gold-and-lotus confetti burst. Re-fires whenever `fire` changes to a new truthy number. */
export function Confetti({ fire }: { fire: number }) {
  const t = useTheme();
  const [pieces, setPieces] = useState<{ id: string; props: Parameters<typeof Piece>[0] }[]>([]);
  useEffect(() => {
    if (!fire) return;
    const colors = [t.primary, "#d9b56e", t.love, t.success, "#f3e9d2", t.info];
    setPieces(
      Array.from({ length: 70 }, (_, i) => ({
        id: `${fire}-${i}`,
        props: {
          color: colors[i % colors.length]!,
          delay: Math.random() * 250,
          x: Math.random() * SW,
          drift: 20 + Math.random() * 40,
          spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
          size: 7 + Math.random() * 7,
          shape: Math.random() > 0.35 ? "rect" : "dot",
        },
      })),
    );
    const id = setTimeout(() => setPieces([]), 3600);
    return () => clearTimeout(id);
  }, [fire, t]);
  if (!pieces.length) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
      {pieces.map((p) => (
        <Piece key={p.id} {...p.props} />
      ))}
    </View>
  );
}
