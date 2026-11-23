/**
 * Side navigation in the same language as the tab bar:
 * ivory card with a concave notch cradling the raised gold Nil Manel button, duotone icon tiles,
 * a gold highlight that glides to the active row, and a layered 3D reveal of the page.
 * Open with useDrawer().open() or by swiping from the left edge on tab screens.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Dimensions, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInLeft,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CalendarDays,
  Clock4,
  ExternalLink,
  Globe,
  Heart,
  Home,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  Music,
  Network,
  Palette,
  Settings,
  Store,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import type { MineWedding } from "@ceylonweddings/contracts";
import { BrandMark } from "./brand";
import { impact, tap } from "./ui/haptics"; // direct import avoids the ui/index ↔ drawer require cycle
import { api, WEB_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { font, useAppearance, useTheme, type ThemeMode } from "@/theme";

const { width: SW } = Dimensions.get("window");
const PANEL = Math.min(304, SW * 0.78);
const ease = { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) }; // smooth ease-out, no overshoot
const TAB_ROUTES = ["/", "/checklist", "/vendors", "/guests", "/budget"];
const ROW_H = 50;
const FAB = 64;
const NOTCH_R = FAB / 2 + 8;

const Ctx = createContext<{ open: () => void; close: () => void }>({ open: () => {}, close: () => {} });
export const useDrawer = () => useContext(Ctx);

type Item = { label: string; icon: LucideIcon; href?: string; web?: string };
const PLAN: Item[] = [
  { label: "Wedding", icon: Home, href: "/" },
  { label: "Checklist", icon: ListChecks, href: "/checklist" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Day-of agenda", icon: Clock4, href: "/agenda" },
  { label: "Vendors", icon: Store, href: "/vendors" },
  { label: "Guests", icon: Users, href: "/guests" },
  { label: "Budget", icon: Wallet, href: "/budget" },
];
const WEB: Item[] = [
  { label: "Wedding website", icon: Globe, web: "/planning/website" },
  { label: "Seating", icon: Network, web: "/planning/seating" },
  { label: "Music", icon: Music, web: "/planning/music" },
  { label: "Moodboards", icon: Palette, web: "/planning/moodboard" },
  { label: "Family", icon: Heart, web: "/planning/family" },
];

/** Card outline with a concave notch at the top centre (the tab bar, flipped onto the profile card). */
function notchedCard(w: number, h: number, r = 26) {
  const cx = w / 2,
    nr = NOTCH_R,
    s = 12;
  return [
    `M ${r} 0`,
    `L ${cx - nr - s} 0`,
    `C ${cx - nr} 0, ${cx - nr} 0, ${cx - nr + 2} 6`,
    `A ${nr} ${nr} 0 0 0 ${cx + nr - 2} 6`,
    `C ${cx + nr} 0, ${cx + nr} 0, ${cx + nr + s} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${r} ${h}`,
    `Q 0 ${h} 0 ${h - r}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0 Z`,
  ].join(" ");
}

function IconTile({ Icon, active, color }: { Icon: LucideIcon; active: boolean; color: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? t.primary : t.inset,
      }}
    >
      <Icon
        size={18}
        color={active ? t.primaryFg : color}
        strokeWidth={active ? 2 : 1.7}
        fill={active ? `${t.primaryFg}40` : `${color}22`}
      />
    </View>
  );
}

function ThemeSwitch() {
  const t = useTheme();
  const { mode, setMode, syncAccount } = useAppearance();
  const opts: [ThemeMode, LucideIcon, string][] = [
    ["light", Sun, "Light"],
    ["system", Monitor, "System"],
    ["dark", Moon, "Dark"],
  ];
  const idx = Math.max(
    0,
    opts.findIndex(([m]) => m === mode),
  );
  const [w, setW] = useState(0);
  const slot = (w - 6) / 3;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(idx * slot, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [idx, slot, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const choose = (m: ThemeMode) => {
    impact();
    setMode(m);
    void syncAccount({ themeMode: m });
  };
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: "row", backgroundColor: t.inset, borderRadius: 99, padding: 3 }}
    >
      {w ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 3,
              left: 3,
              width: slot,
              bottom: 3,
              borderRadius: 99,
              backgroundColor: t.card,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            },
            pill,
          ]}
        />
      ) : null}
      {opts.map(([m, Icon, label]) => {
        const on = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => choose(m)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${label} theme`}
            style={{
              flex: 1,
              height: 36,
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color={on ? t.primary : t.muted} />
            <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: on ? t.heading : t.muted }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Menu({ close, wedding, openCount }: { close: () => void; wedding?: MineWedding; openCount: number }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const all = [...PLAN, { label: "Settings", icon: Settings, href: "/settings" }];
  const activeIdx = PLAN.findIndex((it) => it.href === pathname);

  // Gold highlight glides to the active row
  const y = useSharedValue(Math.max(0, activeIdx) * ROW_H);
  useEffect(() => {
    if (activeIdx >= 0) y.value = withTiming(activeIdx * ROW_H, ease);
  }, [activeIdx, y]);
  const highlight = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  // Brand button: pop + gentle breathing glow while open
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = 0;
    glow.value = withDelay(
      250,
      withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1),
    );
  }, [openCount, glow]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.15 + glow.value * 0.25,
    transform: [{ scale: 1.1 + glow.value * 0.18 }],
  }));

  const go = (href: string) => {
    tap();
    close();
    setTimeout(() => (TAB_ROUTES.includes(href) ? router.navigate(href as never) : router.push(href as never)), 200);
  };
  const names = wedding ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}` : (user?.name ?? "");
  const days = wedding?.hubStats?.daysToNextEvent;
  const cardW = PANEL - 32;
  const cardH = 132;

  const row = (it: Item, i: number, highlightable: boolean) => {
    const active = highlightable && it.href === pathname;
    return (
      <Animated.View
        key={`${openCount}-${it.label}`}
        entering={FadeInLeft.delay(80 + i * 22)
          .duration(260)
          .easing(Easing.out(Easing.cubic))}
      >
        <Pressable
          onPress={() => (it.href ? go(it.href) : (tap(), Linking.openURL(`${WEB_URL}${it.web}`)))}
          style={({ pressed }) => ({
            height: ROW_H,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 8,
            borderRadius: 16,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <IconTile Icon={it.icon} active={active} color={t.body} />
          <Text style={{ flex: 1, fontFamily: font.sansMedium, fontSize: 15, color: active ? t.heading : t.body }}>
            {it.label}
          </Text>
          {it.web ? <ExternalLink size={14} color={t.muted} /> : null}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View
      style={{
        width: PANEL,
        flex: 1,
        paddingTop: insets.top + FAB / 2 + 14,
        paddingBottom: insets.bottom + 10,
        paddingHorizontal: 16,
      }}
    >
      {/* Notched profile card + raised brand button */}
      <Animated.View
        key={`card-${openCount}`}
        entering={FadeIn.duration(260)}
        style={{ height: cardH, marginBottom: 14 }}
      >
        <Svg width={cardW} height={cardH} style={{ position: "absolute" }}>
          <Path d={notchedCard(cardW, cardH)} fill={t.card} stroke={t.border} strokeWidth={0.6} />
        </Svg>
        <View style={{ position: "absolute", top: -FAB / 2 + 2, left: 0, right: 0, alignItems: "center" }}>
          <Animated.View
            style={[
              { position: "absolute", width: FAB, height: FAB, borderRadius: FAB / 2, backgroundColor: t.primary },
              halo,
            ]}
          />
          <Pressable
            onPress={() => go("/")}
            accessibilityLabel="Wedding home"
            style={{
              width: FAB,
              height: FAB,
              borderRadius: FAB / 2,
              backgroundColor: t.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: t.primary,
              shadowOpacity: 0.45,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <BrandMark height={34} color={t.primaryFg} cutColor={t.primary} />
          </Pressable>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 16,
            paddingHorizontal: 14,
          }}
        >
          <Text numberOfLines={1} style={{ fontFamily: font.display, fontSize: 23, color: t.heading }}>
            {names}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>
              {[formatDate(wedding?.date), wedding?.city].filter(Boolean).join(" · ")}
            </Text>
            {days != null ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 4,
                  backgroundColor: t.accentBg,
                  borderRadius: 99,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontFamily: font.display, fontSize: 15, color: t.primaryText }}>{days}</Text>
                <Text style={{ fontFamily: font.sansMedium, fontSize: 9, letterSpacing: 1.4, color: t.primaryText }}>
                  DAYS
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.group, { color: t.muted }]}>PLANNING</Text>
        <View>
          {activeIdx >= 0 ? (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: ROW_H,
                  borderRadius: 16,
                  backgroundColor: t.accentBg,
                },
                highlight,
              ]}
            >
              <View
                style={{
                  position: "absolute",
                  right: 12,
                  top: ROW_H / 2 - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.primary,
                }}
              />
            </Animated.View>
          ) : null}
          {PLAN.map((it, i) => row(it, i, true))}
        </View>
        <Text style={[s.group, { color: t.muted, marginTop: 16 }]}>ON THE WEB</Text>
        {WEB.map((it, i) => row(it, i + PLAN.length, false))}
      </ScrollView>

      <Animated.View
        key={`foot-${openCount}`}
        entering={FadeIn.delay(220).duration(260)}
        style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border, paddingTop: 12, gap: 10 }}
      >
        {row({ label: "Settings", icon: Settings, href: "/settings" }, all.length, true)}
        <View style={{ paddingHorizontal: 4 }}>
          <ThemeSwitch />
        </View>
        <Pressable
          onPress={() => {
            close();
            signOut();
          }}
          accessibilityLabel="Sign out"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: 40,
            borderRadius: 20,
            backgroundColor: pressed ? t.dangerSubtle : "transparent",
          })}
        >
          <LogOut size={16} color={t.danger} />
          <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.danger }}>Sign out</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();
  const p = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [wedding, setWedding] = useState<MineWedding>();

  const show = useCallback(() => {
    setIsOpen(true);
    setOpenCount((n) => n + 1);
  }, []);
  const open = useCallback(() => {
    impact();
    show();
    p.value = withTiming(1, ease);
  }, [p, show]);
  const close = useCallback(() => {
    p.value = withTiming(0, ease, () => runOnJS(setIsOpen)(false));
  }, [p]);
  useEffect(() => {
    if (isOpen && user && !wedding)
      api
        .wedding()
        .then(setWedding)
        .catch(() => {});
  }, [isOpen, user, wedding]);
  useEffect(() => {
    if (!user) {
      setWedding(undefined);
      p.value = 0;
      setIsOpen(false);
    }
  }, [user, p]);

  const edgeEnabled = !!user && TAB_ROUTES.includes(pathname) && !isOpen;
  const edge = Gesture.Pan()
    .enabled(edgeEnabled)
    .activeOffsetX(12)
    .failOffsetY([-15, 15])
    .onBegin(() => runOnJS(show)())
    .onUpdate((e) => {
      p.value = Math.max(0, Math.min(1, e.translationX / PANEL));
    })
    .onEnd((e) => {
      const ok = p.value > 0.35 || e.velocityX > 600;
      p.value = withTiming(ok ? 1 : 0, ease, () => {
        if (!ok) runOnJS(setIsOpen)(false);
      });
      if (ok) runOnJS(impact)();
    });
  const drag = Gesture.Pan()
    .activeOffsetX(-10)
    .onUpdate((e) => {
      p.value = Math.max(0, Math.min(1, 1 + e.translationX / PANEL));
    })
    .onEnd((e) => {
      const stay = p.value > 0.6 && e.velocityX > -600;
      p.value = withTiming(stay ? 1 : 0, ease, () => {
        if (!stay) runOnJS(setIsOpen)(false);
      });
    });

  // Reveal: the page slides right and shrinks, leaving part of it peeking beside the menu.
  const page = useAnimatedStyle(() => ({
    borderRadius: interpolate(p.value, [0, 1], [0, 38], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(p.value, [0, 1], [0, PANEL - 10]) },
      { scale: interpolate(p.value, [0, 1], [1, 0.86]) },
    ],
  }));
  const menu = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0, 0.6, 1]),
    transform: [{ translateX: interpolate(p.value, [0, 1], [-30, 0]) }],
  }));
  const shade = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 1], [0, t.dark ? 0.25 : 0.06]) }));

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: t.inset }}>
        {isOpen ? (
          <>
            <Animated.View style={[StyleSheet.absoluteFill, menu]}>
              <Menu close={close} wedding={wedding} openCount={openCount} />
            </Animated.View>
          </>
        ) : null}
        <Animated.View style={[{ flex: 1, overflow: "hidden" }, page, isOpen && s.lift]}>
          {children}
          {isOpen ? (
            <GestureDetector gesture={drag}>
              <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu">
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#0b0806" }, shade]} />
              </Pressable>
            </GestureDetector>
          ) : null}
        </Animated.View>
        {edgeEnabled ? (
          <GestureDetector gesture={edge}>
            <View style={{ position: "absolute", left: 0, top: 120, bottom: 140, width: 22 }} />
          </GestureDetector>
        ) : null}
      </View>
    </Ctx.Provider>
  );
}

const s = StyleSheet.create({
  group: { fontFamily: font.sansMedium, fontSize: 10, letterSpacing: 2.6, paddingHorizontal: 10, marginBottom: 6 },
  lift: {
    shadowColor: "#2b1f16",
    shadowOpacity: 0.28,
    shadowRadius: 34,
    shadowOffset: { width: -8, height: 10 },
    elevation: 24,
  },
});
