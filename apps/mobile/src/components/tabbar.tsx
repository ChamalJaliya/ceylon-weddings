/**
 * Notched tab bar where the ACTIVE tab pops up: the concave notch and the raised gold
 * circle glide to whichever tab is selected and show its icon (Home shows the Nil Manel mark).
 * Long-press the raised circle for quick actions. Smooth eased motion — no springs.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarPlus, Clock4, ListPlus, Search, type LucideIcon } from "lucide-react-native";
import { BrandMark } from "./brand";
import { impact, tap } from "./ui/haptics";
import { font, useTheme } from "@/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const BAR_H = 68;
const FAB = 60;
const NOTCH_R = FAB / 2 + 8;
const glide = { duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1) };

const QUICK: { label: string; icon: LucideIcon; go: () => void }[] = [
  { label: "Task", icon: ListPlus, go: () => router.navigate("/checklist") },
  { label: "Appointment", icon: CalendarPlus, go: () => router.push("/calendar") },
  { label: "Find vendor", icon: Search, go: () => router.navigate("/vendors") },
  { label: "Agenda", icon: Clock4, go: () => router.push("/agenda") },
];

function QuickActions({ onClose, cx, bottomPad }: { onClose: () => void; cx: number; bottomPad: number }) {
  const t = useTheme();
  const n = QUICK.length;
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      style={{ position: "absolute", left: 0, right: 0, top: -2000, bottom: 0 }}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: t.overlay.quickAction }}
        onPress={onClose}
        accessibilityLabel="Close quick actions"
      />
      {QUICK.map((q, i) => {
        // fan leans inward when the active tab is near an edge
        const lean = cx < 120 ? -0.18 : cx > 260 ? 0.18 : 0;
        const angle = Math.PI * (0.15 + lean + (0.7 * i) / (n - 1));
        const R = 112;
        const x = -Math.cos(angle) * R;
        const y = Math.sin(angle) * R;
        const Icon = q.icon;
        return (
          <Animated.View
            key={q.label}
            entering={ZoomIn.delay(i * 35).duration(220)}
            style={{
              position: "absolute",
              bottom: bottomPad + BAR_H - 30 + y,
              left: Math.min(Math.max(cx + x - 32, 8), 9999),
              width: 64,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pressable
              onPress={() => {
                tap();
                onClose();
                setTimeout(q.go, 120);
              }}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: t.card,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: t.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                shadowColor: t.ink,
                shadowOpacity: 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              })}
            >
              <Icon size={21} color={t.primary} />
            </Pressable>
            <Text
              style={{ fontFamily: font.sansMedium, fontSize: 11, color: t.overlay.onImageFg, textAlign: "center" }}
            >
              {q.label}
            </Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const [quick, setQuick] = useState(false);
  const bottomPad = Math.max(insets.bottom, 8);
  const n = state.routes.length;
  const slot = w / n;
  const targetX = slot * state.index + slot / 2;

  const cx = useSharedValue(0);
  const dip = useSharedValue(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!w) return;
    if (!ready) {
      cx.value = targetX;
      setReady(true);
      return;
    }
    cx.value = withTiming(targetX, glide);
    // circle sinks into the bar as it travels, then rises in its new notch
    dip.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetX, w]);

  // Bar outline with a concave notch centred on cx (built on the UI thread every frame)
  // Docked bar outline with a concave notch centred on cx. Extends past both edges so the
  // notch works right up to the first/last tab without clamping.
  const pathProps = useAnimatedProps(() => {
    const W = w,
      H = BAR_H + bottomPad,
      nr = NOTCH_R,
      s = 12,
      c = cx.value;
    const depth = 6 * (1 - dip.value * 0.6);
    return {
      d: `M -80 0 L ${c - nr - s} 0 C ${c - nr} 0, ${c - nr} 0, ${c - nr + 2} ${depth} A ${nr} ${nr} 0 0 0 ${c + nr - 2} ${depth} C ${c + nr} 0, ${c + nr} 0, ${c + nr + s} 0 L ${W + 80} 0 L ${W + 80} ${H} L -80 ${H} Z`,
    };
  });
  const fab = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value - FAB / 2 }, { translateY: dip.value * 22 }, { scale: 1 - dip.value * 0.12 }],
  }));

  const active = state.routes[state.index]!;
  const activeOpts = descriptors[active.key]!.options;
  const go = (i: number) => {
    const route = state.routes[i]!;
    const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (state.index !== i && !e.defaultPrevented) {
      tap();
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
      {quick ? <QuickActions onClose={() => setQuick(false)} cx={targetX} bottomPad={bottomPad} /> : null}

      <View
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        style={{
          height: BAR_H + bottomPad,
          shadowColor: t.ink,
          shadowOpacity: t.dark ? 0.4 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        }}
      >
        {w ? (
          <Svg width={w} height={BAR_H + bottomPad} style={{ position: "absolute" }}>
            <AnimatedPath animatedProps={pathProps} fill={t.card} stroke={t.border} strokeWidth={0.6} />
          </Svg>
        ) : null}
        <View style={{ flexDirection: "row", height: BAR_H }}>
          {state.routes.map((route, i) => {
            const { options } = descriptors[route.key]!;
            const focused = state.index === i;
            const label = options.title ?? route.name;
            return (
              <Pressable
                key={route.key}
                onPress={() => go(i)}
                onLongPress={
                  focused
                    ? () => {
                        impact();
                        setQuick(true);
                      }
                    : undefined
                }
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }}
              >
                {focused ? (
                  // active slot: icon lives in the raised circle; show its label lower in the bar
                  <Animated.Text
                    entering={FadeIn.delay(180).duration(200)}
                    style={{ fontFamily: font.sansMedium, fontSize: 10, color: t.primaryText, marginTop: 30 }}
                  >
                    {label}
                  </Animated.Text>
                ) : (
                  <Animated.View entering={FadeIn.duration(220)} style={{ alignItems: "center", gap: 3 }}>
                    {route.name === "index" ? (
                      <BrandMark height={24} color={t.muted} cutColor={t.card} />
                    ) : (
                      options.tabBarIcon?.({ focused: false, color: t.muted, size: 23 })
                    )}
                    <Text style={{ fontFamily: font.sansMedium, fontSize: 10, color: t.muted }}>{label}</Text>
                  </Animated.View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Raised circle that follows the active tab */}
      {w ? (
        <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 0, top: -FAB / 2 + 2 }, fab]}>
          <Pressable
            onPress={() => (quick ? setQuick(false) : tap())}
            onLongPress={() => {
              impact();
              setQuick(true);
            }}
            delayLongPress={280}
            accessibilityLabel={`${activeOpts.title ?? active.name}. Long-press for quick actions`}
          >
            <View
              style={{
                width: FAB,
                height: FAB,
                borderRadius: FAB / 2,
                backgroundColor: t.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: t.primary,
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 10,
              }}
            >
              <Animated.View key={active.key} entering={FadeIn.duration(240)} exiting={FadeOut.duration(120)}>
                {active.name === "index" ? (
                  <BrandMark height={32} color={t.primaryFg} cutColor={t.primary} />
                ) : (
                  activeOpts.tabBarIcon?.({ focused: true, color: t.primaryFg, size: 26 })
                )}
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Space to leave at the bottom of tab screens so content clears the floating bar. */
export const TAB_BAR_SPACE = 120;
