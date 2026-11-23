import { useState } from "react";
import { Dimensions, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  ZoomOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, CalendarHeart, Check, ChevronRight, Menu, Sparkles, Store } from "lucide-react-native";
import { useDrawer } from "@/components/drawer";
import { BrandLockup, BrandMark } from "@/components/brand";
import { Confetti, CountUp, Rise, Ring } from "@/components/motion";
import { SwipeRow } from "@/components/swipe-row";
import { TAB_BAR_SPACE } from "@/components/tabbar";
import { useToast } from "@/components/toast";
import {
  CountdownWidget,
  GuestsWidget,
  NextAppointmentWidget,
  PaymentsWidget,
  PlatesWidget,
  ReadinessWidget,
  TeamWidget,
  TipWidget,
} from "@/components/widgets";
import {
  Body,
  Card,
  Carousel,
  Display,
  ErrorNote,
  Eyebrow,
  FrostedHeader,
  IconButton,
  ScreenSkeleton,
  Section,
  success,
  Touchable,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatLkr, titleCase } from "@/lib/format";
import { cw, font, radius, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

const { width: W, height: SH } = Dimensions.get("window");
const HERO = Math.min(520, SH * 0.6);

function RingStat({
  label,
  value,
  total,
  color,
  onPress,
  format,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  onPress: () => void;
  format?: (n: number) => string;
}) {
  const t = useTheme();
  const pct = total ? value / total : 0;
  return (
    <Touchable onPress={onPress} style={{ flex: 1 }}>
      <Card style={{ alignItems: "center", gap: 10, paddingVertical: 18 }}>
        <Ring value={pct} size={74} stroke={6} color={color}>
          <Text style={{ fontFamily: font.display, fontSize: 20, color: t.heading }}>{Math.round(pct * 100)}%</Text>
        </Ring>
        <View style={{ alignItems: "center" }}>
          <Eyebrow size={9}>{label}</Eyebrow>
          <Body size={13} medium style={{ color: t.heading, marginTop: 2 }}>
            {format ? format(value) : value} <Text style={{ color: t.muted }}>/ {format ? format(total) : total}</Text>
          </Body>
        </View>
      </Card>
    </Touchable>
  );
}

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const drawer = useDrawer();
  const { data: w, setData, error, loading, refreshing, refresh: refreshWedding, reload } = useQuery(api.wedding);
  const extras = useQuery(async () => {
    const [appts, lines] = await Promise.all([api.appointments().catch(() => []), api.budget().catch(() => [])]);
    return { appts, lines };
  });
  const refresh = () => {
    refreshWedding();
    extras.refresh();
  };
  const [burst, setBurst] = useState(0);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const heroImg = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-HERO, 0, HERO], [-HERO / 2, 0, HERO * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-HERO, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const heroText = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, HERO * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [0, HERO], [0, -60], Extrapolation.CLAMP) }],
  }));
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [HERO - 160, HERO - 90], [0, 1], Extrapolation.CLAMP),
  }));

  if (loading && !w) return <ScreenSkeleton />;

  const stats = w?.hubStats;
  const days = stats?.daysToNextEvent;
  const tasks = w?.tasks ?? [];
  const upNext = tasks
    .filter((x) => x.status !== "DONE")
    .sort((a, b) => (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"))
    .slice(0, 4);
  const events = [...(w?.events ?? [])].sort((a, b) => (a.startsAt ?? "9").localeCompare(b.startsAt ?? "9"));
  const cover = w?.coverImageUrl;
  const fg = cover ? t.heroFg : t.heading;
  const fgMuted = cover ? t.overlay.glassChipStrong : t.muted;

  function complete(id: string) {
    if (!w) return;
    const prev = w;
    success();
    const next = tasks.map((x) => (x.id === id ? { ...x, status: "DONE" as const } : x));
    setData({ ...w, tasks: next });
    if (next.every((x) => x.status === "DONE")) setBurst(Date.now());
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      void api.setTaskStatus(id, "DONE").catch(() => {
        toast("Couldn't save that", "error");
        reload();
      });
    };
    toast("Nice — task complete", {
      actionLabel: "Undo",
      durationMs: 4200,
      onAction: () => {
        committed = true;
        setData(prev);
      },
    });
    setTimeout(commit, 4200);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <Confetti fire={burst} />

      <FrostedHeader
        title={w ? `${w.partnerOneName} & ${w.partnerTwoName}` : "Your wedding"}
        animatedStyle={bar}
        height={52}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={cover ? t.overlay.onImageFg : t.primary}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Stretchy parallax hero */}
        <View style={{ height: HERO, overflow: "hidden", backgroundColor: t.inset }}>
          <Animated.View style={[{ position: "absolute", top: 0, left: 0, width: W, height: HERO }, heroImg]}>
            {cover ? (
              <>
                <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" transition={400} />
                <LinearGradient
                  colors={[t.overlay.scrimTop, t.overlay.scrimMid, t.overlay.scrimBottom]}
                  locations={[0, 0.4, 1]}
                  style={{ position: "absolute", inset: 0 }}
                />
              </>
            ) : (
              <>
                <LinearGradient colors={[t.accentBg, t.page]} style={{ position: "absolute", inset: 0 }} />
                <View style={{ position: "absolute", right: -60, top: insets.top + 10, opacity: 0.1 }}>
                  <BrandMark height={HERO * 0.75} cutColor={t.accentBg} />
                </View>
              </>
            )}
          </Animated.View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: insets.top + 8,
            }}
          >
            <BrandLockup size="sm" color={cover ? t.heroFg : undefined} cutColor={cover ? cw.night800 : t.accentBg} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <IconButton label="Calendar" tone={cover ? "glass" : "card"} onPress={() => router.push("/calendar")}>
                <CalendarDays size={18} color={fg} />
              </IconButton>
              <IconButton label="Open menu" tone={cover ? "glass" : "card"} onPress={drawer.open}>
                <Menu size={19} color={fg} />
              </IconButton>
            </View>
          </View>

          <Animated.View style={[{ position: "absolute", left: 24, right: 24, bottom: 44 }, heroText]}>
            <Eyebrow color={fgMuted}>The wedding of</Eyebrow>
            <Display size={52} color={fg} style={{ lineHeight: 52, marginTop: 8 }}>
              {w?.partnerOneName ?? "You"}
              {"\n"}
              <Display size={40} color={cover ? fg : t.primaryText} style={{ fontFamily: font.displayItalic }}>
                &{" "}
              </Display>
              {w?.partnerTwoName ?? "your love"}
            </Display>
            <View
              style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 18 }}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 }}>
                {[formatDate(w?.date), w?.city].filter(Boolean).map((x) => (
                  <View
                    key={x}
                    style={{
                      borderWidth: 1,
                      borderColor: cover ? t.overlay.glassChip : t.borderStrong,
                      borderRadius: 99,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      backgroundColor: cover ? t.overlay.glassFill : "transparent",
                    }}
                  >
                    <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: fg }}>{x}</Text>
                  </View>
                ))}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {days != null ? (
                  <CountUp
                    value={days}
                    style={{ fontFamily: font.display, fontSize: 64, lineHeight: 64, color: fg }}
                    duration={1400}
                  />
                ) : (
                  <Text style={{ fontFamily: font.display, fontSize: 64, lineHeight: 64, color: fg }}>—</Text>
                )}
                <Eyebrow size={9} color={fgMuted}>
                  {days == null ? "set your date" : days === 1 ? "day to go" : "days to go"}
                </Eyebrow>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Sheet that overlaps the hero */}
        <View
          style={{
            marginTop: -26,
            borderTopLeftRadius: radius.hero,
            borderTopRightRadius: radius.hero,
            backgroundColor: t.page,
            paddingHorizontal: 20,
            paddingTop: 22,
          }}
        >
          {error ? <ErrorNote message={error} onRetry={reload} /> : null}

          {w ? (
            <View style={{ gap: 12 }}>
              <CountdownWidget
                at={stats?.nextEventAt ?? w.date}
                name={stats?.nextEventName}
                nekath={events.find((e) => e.id === stats?.nextEventId)?.nekathAt}
              />
              <ReadinessWidget w={w} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <GuestsWidget w={w} />
                <View style={{ flex: 1, gap: 12 }}>
                  <NextAppointmentWidget appts={extras.data?.appts ?? []} />
                  <PaymentsWidget lines={extras.data?.lines ?? w.budgetLines ?? []} />
                </View>
              </View>
              <TeamWidget w={w} />
              <PlatesWidget w={w} />
            </View>
          ) : null}

          <Rise index={2}>
            <Section title="Up next" action="All tasks" onAction={() => router.push("/checklist")}>
              {upNext.length ? (
                <Card padded={false} style={{ overflow: "hidden" }}>
                  {upNext.map((task, i) => (
                    <Animated.View
                      key={task.id}
                      exiting={ZoomOut.duration(220)}
                      layout={LinearTransition.duration(280)}
                    >
                      <SwipeRow
                        left={{
                          label: "Done",
                          icon: <Check size={22} color={t.overlay.onImageFg} />,
                          color: t.success,
                          onAction: () => complete(task.id),
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 15,
                            backgroundColor: t.card,
                            borderTopWidth: i ? 1 : 0,
                            borderTopColor: t.border,
                          }}
                        >
                          <Pressable
                            onPress={() => complete(task.id)}
                            hitSlop={10}
                            accessibilityLabel={`Complete ${task.title}`}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: t.borderStrong,
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Body medium style={{ color: t.heading }} numberOfLines={1}>
                              {task.title}
                            </Body>
                            {task.dueAt ? (
                              <Body muted size={12}>
                                Due {formatDate(task.dueAt)}
                              </Body>
                            ) : null}
                          </View>
                          <ChevronRight size={16} color={t.border} />
                        </View>
                      </SwipeRow>
                    </Animated.View>
                  ))}
                </Card>
              ) : (
                <Animated.View entering={FadeIn}>
                  <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Sparkles size={20} color={t.primaryText} />
                    <Body style={{ flex: 1 }}>You're all caught up. Enjoy the moment.</Body>
                  </Card>
                </Animated.View>
              )}
              {upNext.length ? (
                <Body muted size={12} style={{ textAlign: "center", marginTop: 8 }}>
                  Swipe right to complete
                </Body>
              ) : null}
            </Section>
          </Rise>

          {events.length ? (
            <Rise index={3}>
              <Section title="Celebrations">
                <View style={{ marginHorizontal: -20 }}>
                  <Carousel peek={20} gap={12}>
                    {events.map((e, i) => (
                      <Touchable
                        key={e.id}
                        onPress={() => router.push({ pathname: "/agenda", params: { event: e.id } })}
                      >
                        <Card
                          style={{
                            minHeight: 170,
                            justifyContent: "space-between",
                            backgroundColor: i === 0 ? t.heading : t.card,
                            borderColor: i === 0 ? t.heading : t.border,
                          }}
                        >
                          <View>
                            <Eyebrow size={9} color={i === 0 ? t.primary : t.primaryText}>
                              {i === 0 ? "Next · " : ""}
                              {titleCase(e.kind)}
                            </Eyebrow>
                            <Display size={26} color={i === 0 ? t.page : t.heading} style={{ marginTop: 6 }}>
                              {e.name}
                            </Display>
                          </View>
                          <View style={{ gap: 6 }}>
                            <Body size={13} style={{ color: i === 0 ? t.page : t.muted, opacity: i === 0 ? 0.75 : 1 }}>
                              {formatDate(e.startsAt)}
                              {e.venueName ? `  ·  ${e.venueName}` : ""}
                            </Body>
                            {e.nekathAt ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <CalendarHeart size={13} color={t.primary} />
                                <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.primary }}>
                                  Nekath{" "}
                                  {new Date(e.nekathAt).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </Card>
                      </Touchable>
                    ))}
                  </Carousel>
                </View>
              </Section>
            </Rise>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <TipWidget />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
