import { useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  runOnJS,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from "lucide-react-native";
import type { Appointment } from "@ceylonweddings/contracts";
import { Sheet, type SheetRef } from "@/components/sheet";
import { SwipeRow } from "@/components/swipe-row";
import { useToast } from "@/components/toast";
import {
  Body,
  Button,
  Card,
  Display,
  EmptyState,
  ErrorNote,
  Eyebrow,
  IconButton,
  impact,
  Pill,
  ScreenSkeleton,
  success,
  tap,
} from "@/components/ui";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { font, radius, shadow, useTheme } from "@/lib/theme";
import { useQuery } from "@/lib/useQuery";

const W = Dimensions.get("window").width;
const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const KINDS: Appointment["kind"][] = ["VENDOR_MEETING", "TASTING", "FITTING", "CEREMONY", "DAY_OF", "OTHER"];
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) => key(a) === key(b);
const hm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const TIMES = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:30"];
const DURATIONS: [string, number][] = [
  ["30 min", 30],
  ["1 hr", 60],
  ["2 hr", 120],
  ["Half day", 240],
];

export default function CalendarScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const sheet = useRef<SheetRef>(null);
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [dir, setDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState(today);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Appointment["kind"]>("VENDOR_MEETING");
  const [time, setTime] = useState("10:00");
  const [dur, setDur] = useState(60);
  const [venue, setVenue] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, setData, error, loading, refreshing, refresh, reload } = useQuery(async () => {
    const [appts, w] = await Promise.all([api.appointments(), api.wedding()]);
    return { appts, events: w.events ?? [] };
  });

  const kindColor = (k: Appointment["kind"]) =>
    ({
      VENDOR_MEETING: t.info,
      TASTING: t.warning,
      FITTING: t.love,
      CEREMONY: t.primary,
      DAY_OF: t.success,
      OTHER: t.muted,
    })[k];

  const byDay = useMemo(() => {
    const m = new Map<string, { color: string }[]>();
    for (const a of data?.appts ?? []) {
      const k = key(new Date(a.startsAt));
      m.set(k, [...(m.get(k) ?? []), { color: kindColor(a.kind) }]);
    }
    for (const e of data?.events ?? [])
      if (e.startsAt) {
        const k = key(new Date(e.startsAt));
        m.set(k, [{ color: t.primary }, ...(m.get(k) ?? [])]);
      }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, t]);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
      const d = i - offset + 1;
      return d >= 1 && d <= days ? new Date(month.getFullYear(), month.getMonth(), d) : null;
    });
  }, [month]);

  const shift = (n: 1 | -1) => {
    tap();
    setDir(n);
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  };
  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 50) runOnJS(shift)(e.translationX < 0 ? 1 : -1);
    });

  const dayItems = [
    ...(data?.events ?? [])
      .filter((e) => e.startsAt && sameDay(new Date(e.startsAt), selected))
      .map((e) => ({
        id: `e-${e.id}`,
        title: e.name,
        at: e.startsAt!,
        end: null as string | null,
        venue: e.venueName,
        color: t.primary,
        label: "Celebration",
        appt: null as Appointment | null,
      })),
    ...(data?.appts ?? [])
      .filter((a) => sameDay(new Date(a.startsAt), selected))
      .map((a) => ({
        id: a.id,
        title: a.title,
        at: a.startsAt,
        end: a.endsAt,
        venue: a.venueName,
        color: kindColor(a.kind),
        label: titleCase(a.kind),
        appt: a,
      })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const upcoming = (data?.appts ?? [])
    .filter((a) => new Date(a.startsAt) >= today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 5);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    const [h, m] = time.split(":").map(Number);
    const start = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), h, m);
    const end = new Date(start.getTime() + dur * 60000);
    try {
      const created = await api.createAppointment({
        title: title.trim(),
        kind,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        venueName: venue.trim() || null,
      });
      success();
      setData((d) => (d ? { ...d, appts: [...d.appts, created] } : d));
      setTitle("");
      setVenue("");
      sheet.current?.dismiss();
      toast("Added to your calendar");
    } catch {
      toast("Couldn't save", "error");
    } finally {
      setSaving(false);
    }
  }

  function remove(a: Appointment) {
    setData((d) => (d ? { ...d, appts: d.appts.filter((x) => x.id !== a.id) } : d));
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      void api.deleteAppointment(a.id).catch(() => {
        toast("Couldn't remove", "error");
        reload();
      });
    };
    toast("Removed", {
      tone: "info",
      actionLabel: "Undo",
      durationMs: 4200,
      onAction: () => {
        committed = true;
        reload();
      },
    });
    setTimeout(commit, 4200);
  }

  if (loading && !data) return <ScreenSkeleton />;
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <IconButton label="Back" onPress={() => router.back()}>
            <ChevronLeft size={21} color={t.heading} />
          </IconButton>
          <Pressable
            onPress={() => {
              tap();
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(today);
            }}
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: t.border,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.heading }}>Today</Text>
          </Pressable>
        </View>
        <Eyebrow style={{ marginBottom: 6 }}>Planning</Eyebrow>
        <Display size={40}>Calendar</Display>
        {error ? (
          <View style={{ marginTop: 12 }}>
            <ErrorNote message={error} onRetry={reload} />
          </View>
        ) : null}

        <Card style={{ marginTop: 18, paddingHorizontal: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 6,
              marginBottom: 12,
            }}
          >
            <Pressable onPress={() => shift(-1)} hitSlop={12}>
              <ChevronLeft size={20} color={t.body} />
            </Pressable>
            <Animated.Text
              key={monthLabel}
              entering={FadeIn.duration(250)}
              style={{ fontFamily: font.display, fontSize: 22, color: t.heading }}
            >
              {monthLabel}
            </Animated.Text>
            <Pressable onPress={() => shift(1)} hitSlop={12}>
              <ChevronRight size={20} color={t.body} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row" }}>
            {DOW.map((d, i) => (
              <Text
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: font.sansMedium,
                  fontSize: 11,
                  color: t.muted,
                  letterSpacing: 1,
                }}
              >
                {d}
              </Text>
            ))}
          </View>
          <GestureDetector gesture={swipe}>
            <Animated.View
              key={monthLabel}
              entering={(dir === 1 ? SlideInRight : SlideInLeft).duration(280)}
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}
            >
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 48 }} />;
                const isSel = sameDay(d, selected);
                const isToday = sameDay(d, today);
                const dots = byDay.get(key(d)) ?? [];
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      tap();
                      setSelected(d);
                    }}
                    style={{ width: `${100 / 7}%`, height: 48, alignItems: "center", justifyContent: "center" }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSel ? t.heading : "transparent",
                        borderWidth: isToday && !isSel ? 1 : 0,
                        borderColor: t.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: isSel || isToday ? font.sansMedium : font.sans,
                          fontSize: 15,
                          color: isSel ? t.page : isToday ? t.primaryText : t.heading,
                        }}
                      >
                        {d.getDate()}
                      </Text>
                    </View>
                    <View style={{ position: "absolute", bottom: 3, flexDirection: "row", gap: 2 }}>
                      {dots.slice(0, 3).map((x, k) => (
                        <View key={k} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: x.color }} />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </GestureDetector>
        </Card>

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 26,
            marginBottom: 12,
          }}
        >
          <Display size={24}>
            {selected.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </Display>
        </View>
        <Animated.View key={key(selected)} entering={FadeInDown.duration(280)}>
          {dayItems.length ? (
            <View>
              {dayItems.map((it, i) => (
                <Animated.View key={it.id} layout={LinearTransition} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ width: 54, alignItems: "flex-end", paddingTop: 16 }}>
                    <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.heading }}>{hm(it.at)}</Text>
                    {it.end ? (
                      <Text style={{ fontFamily: font.sans, fontSize: 11, color: t.muted }}>{hm(it.end)}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{ width: 10, height: 10, borderRadius: 5, marginTop: 19, backgroundColor: it.color }}
                    />
                    {i < dayItems.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: t.border }} /> : null}
                  </View>
                  <View style={{ flex: 1, marginBottom: 10 }}>
                    {it.appt ? (
                      <Card padded={false} style={{ overflow: "hidden" }}>
                        <SwipeRow
                          right={{
                            label: "Remove",
                            icon: <Trash2 size={20} color="#fff" />,
                            color: t.danger,
                            onAction: () => remove(it.appt!),
                          }}
                        >
                          <ItemBody it={it} />
                        </SwipeRow>
                      </Card>
                    ) : (
                      <Card padded={false} style={{ overflow: "hidden", borderColor: t.primary }}>
                        <ItemBody it={it} />
                      </Card>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<CalendarPlus size={24} color={t.primaryText} />}
              title="A free day"
              body="Nothing planned yet."
              action="Add appointment"
              onAction={() => {
                impact();
                sheet.current?.present();
              }}
            />
          )}
        </Animated.View>

        {upcoming.length ? (
          <View style={{ marginTop: 26 }}>
            <Display size={24} style={{ marginBottom: 12 }}>
              Coming up
            </Display>
            <Card padded={false}>
              {upcoming.map((a, i) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    tap();
                    const d = new Date(a.startsAt);
                    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    setSelected(d);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    padding: 14,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: t.border,
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      alignItems: "center",
                      borderRadius: 12,
                      backgroundColor: t.inset,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{ fontFamily: font.sansMedium, fontSize: 10, color: kindColor(a.kind), letterSpacing: 1 }}
                    >
                      {new Date(a.startsAt).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}
                    </Text>
                    <Text style={{ fontFamily: font.display, fontSize: 22, color: t.heading, lineHeight: 24 }}>
                      {new Date(a.startsAt).getDate()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body medium style={{ color: t.heading }} numberOfLines={1}>
                      {a.title}
                    </Body>
                    <Body muted size={12}>
                      {hm(a.startsAt)}
                      {a.vendorName ? ` · ${a.vendorName}` : a.venueName ? ` · ${a.venueName}` : ""}
                    </Body>
                  </View>
                  <ChevronRight size={16} color={t.border} />
                </Pressable>
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <Animated.View
        entering={FadeIn.delay(300)}
        style={[{ position: "absolute", right: 22, bottom: insets.bottom + 24 }, shadow.raised]}
      >
        <Pressable
          onPress={() => {
            impact();
            sheet.current?.present();
          }}
          accessibilityLabel="Add appointment"
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: t.primary,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}
        >
          <Plus size={26} color={t.primaryFg} />
        </Pressable>
      </Animated.View>

      <Sheet
        ref={sheet}
        eyebrow={selected.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        title="New appointment"
      >
        <BottomSheetTextInput
          placeholder="e.g. Cake tasting with Butter & Bloom"
          placeholderTextColor={t.muted}
          value={title}
          onChangeText={setTitle}
          style={{
            height: 54,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
            paddingHorizontal: 16,
            fontFamily: font.sans,
            fontSize: 16,
            color: t.heading,
          }}
        />
        <Eyebrow size={10} style={{ marginTop: 18, marginBottom: 10 }}>
          Type
        </Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {KINDS.map((k) => (
            <Pill key={k} label={titleCase(k)} active={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
        <Eyebrow size={10} style={{ marginTop: 18, marginBottom: 10 }}>
          Starts
        </Eyebrow>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {TIMES.map((x) => (
            <Pill key={x} label={x} active={time === x} onPress={() => setTime(x)} />
          ))}
        </ScrollView>
        <Eyebrow size={10} style={{ marginTop: 18, marginBottom: 10 }}>
          Duration
        </Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {DURATIONS.map(([l, n]) => (
            <Pill key={l} label={l} active={dur === n} onPress={() => setDur(n)} />
          ))}
        </View>
        <BottomSheetTextInput
          placeholder="Where? (optional)"
          placeholderTextColor={t.muted}
          value={venue}
          onChangeText={setVenue}
          style={{
            marginTop: 18,
            height: 50,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
            paddingHorizontal: 16,
            fontFamily: font.sans,
            fontSize: 15,
            color: t.heading,
          }}
        />
        <View style={{ marginTop: 22 }}>
          <Button label="Add to calendar" onPress={add} loading={saving} disabled={!title.trim()} />
        </View>
      </Sheet>
    </View>
  );
}

function ItemBody({ it }: { it: { title: string; label: string; venue: string | null; color: string } }) {
  const t = useTheme();
  return (
    <View style={{ padding: 14, gap: 4, backgroundColor: t.card, borderLeftWidth: 3, borderLeftColor: it.color }}>
      <Eyebrow size={9} color={it.color}>
        {it.label}
      </Eyebrow>
      <Body medium style={{ color: t.heading }}>
        {it.title}
      </Body>
      {it.venue ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <MapPin size={12} color={t.muted} />
          <Body muted size={12}>
            {it.venue}
          </Body>
        </View>
      ) : null}
    </View>
  );
}
