import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarHeart, Clock4, ExternalLink, MapPin } from "lucide-react-native";
import type { Appointment } from "@ceylonweddings/contracts";
import { Body, Card, Display, EmptyState, ErrorNote, Eyebrow, Screen, ScreenSkeleton, Tabs } from "@/components/ui";
import { api, WEB_URL } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { font, radius, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

const hm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const mins = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

function LiveDot({ color }: { color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, [p]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ scale: 1 + p.value * 1.8 }] }));
  return (
    <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[{ position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: color }, ring]}
      />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}

export default function AgendaScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ event?: string }>();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { data, error, loading, refreshing, refresh, reload } = useQuery(async () => {
    const [appts, w] = await Promise.all([api.appointments(), api.wedding()]);
    return {
      appts,
      events: [...(w.events ?? [])].sort((a, b) => (a.startsAt ?? "9").localeCompare(b.startsAt ?? "9")),
    };
  });
  const events = data?.events ?? [];
  const [eventId, setEventId] = useState<string | undefined>(params.event);
  const ev = events.find((e) => e.id === eventId) ?? events[0];

  const blocks = useMemo(() => {
    if (!ev || !data) return [] as Appointment[];
    return data.appts
      .filter(
        (a) =>
          a.eventId === ev.id ||
          (!a.eventId &&
            ev.startsAt &&
            (a.kind === "DAY_OF" || a.source === "NEKATH") &&
            sameDay(a.startsAt, ev.startsAt)),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [ev, data]);

  if (loading && !data) return <ScreenSkeleton />;
  const nekath = ev?.nekathAt;

  return (
    <Screen
      nav="back"
      eyebrow="Run of show"
      title="Day-of agenda"
      bottomSpace={60}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
    >
      {error ? <ErrorNote message={error} onRetry={reload} /> : null}

      {events.length > 1 && ev ? (
        <View style={{ marginBottom: 16 }}>
          <Tabs
            value={ev.id}
            onChange={setEventId}
            scrollable
            items={events.map((e) => ({ id: e.id, label: e.name }))}
          />
        </View>
      ) : null}

      {ev ? (
        <Animated.View key={ev.id} entering={FadeInDown.duration(280)}>
          <Card style={{ gap: 8, backgroundColor: t.heading, borderColor: t.heading }}>
            <Eyebrow size={9} color={t.primary}>
              {titleCase(ev.kind)}
            </Eyebrow>
            <Display size={30} color={t.page}>
              {ev.name}
            </Display>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Clock4 size={14} color={t.primary} />
                <Text style={{ fontFamily: font.sans, color: t.page, opacity: 0.8, fontSize: 13 }}>
                  {formatDate(ev.startsAt)}
                </Text>
              </View>
              {ev.venueName ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color={t.primary} />
                  <Text style={{ fontFamily: font.sans, color: t.page, opacity: 0.8, fontSize: 13 }}>
                    {ev.venueName}
                  </Text>
                </View>
              ) : null}
            </View>
            {nekath ? (
              <View
                style={{
                  marginTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: t.overlay.glassFill,
                  paddingTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CalendarHeart size={20} color={t.primary} />
                <View>
                  <Eyebrow size={9} color={t.primary}>
                    Nekath · auspicious time
                  </Eyebrow>
                  <Text style={{ fontFamily: font.display, fontSize: 28, color: t.page }}>{hm(nekath)}</Text>
                </View>
              </View>
            ) : null}
          </Card>

          <View style={{ marginTop: 24 }}>
            {blocks.length ? (
              blocks.map((b, i) => {
                const start = new Date(b.startsAt),
                  end = new Date(b.endsAt);
                const live = now >= start && now < end;
                const past = now >= end;
                const isNekath = !!nekath && new Date(nekath) >= start && new Date(nekath) < end;
                const color = isNekath ? t.primary : live ? t.success : past ? t.borderStrong : (b.color ?? t.info);
                return (
                  <Animated.View
                    key={b.id}
                    entering={FadeInDown.delay(i * 50).duration(280)}
                    style={{ flexDirection: "row", gap: 12, opacity: past ? 0.55 : 1 }}
                  >
                    <View style={{ width: 58, alignItems: "flex-end", paddingTop: 14 }}>
                      <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.heading }}>
                        {hm(b.startsAt)}
                      </Text>
                      <Text style={{ fontFamily: font.sans, fontSize: 11, color: t.muted }}>
                        {mins(b.startsAt, b.endsAt)} min
                      </Text>
                    </View>
                    <View style={{ alignItems: "center", width: 14 }}>
                      <View style={{ marginTop: 17 }}>
                        {live ? (
                          <LiveDot color={t.success} />
                        ) : (
                          <View
                            style={{ width: 10, height: 10, borderRadius: 5, marginLeft: 2, backgroundColor: color }}
                          />
                        )}
                      </View>
                      {i < blocks.length - 1 ? (
                        <View
                          style={{ flex: 1, width: 1.5, backgroundColor: past ? t.success : t.border, marginTop: 2 }}
                        />
                      ) : null}
                    </View>
                    <View style={{ flex: 1, marginBottom: 12 }}>
                      {isNekath ? (
                        <LinearGradient
                          colors={[t.accentBg, t.card]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            borderRadius: radius.lg,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: t.primary,
                            gap: 4,
                          }}
                        >
                          <Eyebrow size={9} color={t.primaryText}>
                            ✦ Nekath moment
                          </Eyebrow>
                          <Display size={21}>{b.title}</Display>
                          {b.ownerLabel ? (
                            <Body muted size={12}>
                              {b.ownerLabel}
                            </Body>
                          ) : null}
                        </LinearGradient>
                      ) : (
                        <Card
                          style={{
                            gap: 4,
                            borderColor: live ? t.success : t.border,
                            borderWidth: live ? 1.5 : undefined,
                          }}
                        >
                          {live ? (
                            <Eyebrow size={9} color={t.success}>
                              Happening now
                            </Eyebrow>
                          ) : null}
                          <Body medium style={{ color: t.heading }}>
                            {b.title}
                          </Body>
                          {[b.ownerLabel, b.vendorName, b.venueName].filter(Boolean).length ? (
                            <Body muted size={12}>
                              {[b.ownerLabel, b.vendorName, b.venueName].filter(Boolean).join(" · ")}
                            </Body>
                          ) : null}
                          {b.notes ? (
                            <Body size={13} style={{ marginTop: 4 }}>
                              {b.notes}
                            </Body>
                          ) : null}
                        </Card>
                      )}
                    </View>
                  </Animated.View>
                );
              })
            ) : (
              <EmptyState
                icon={<Clock4 size={24} color={t.primaryText} />}
                title="No run-of-show yet"
                body={
                  nekath
                    ? "Generate your day-of schedule from the nekath time on the website."
                    : "Add your blocks on the website and they'll appear here live on the day."
                }
                action="Open on the web"
                onAction={() => Linking.openURL(`${WEB_URL}/planning/agenda`)}
              />
            )}
          </View>
          {blocks.length ? (
            <Pressable
              onPress={() => Linking.openURL(`${WEB_URL}/planning/agenda`)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}
            >
              <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.primaryText }}>
                Edit run-of-show on the web
              </Text>
              <ExternalLink size={13} color={t.primaryText} />
            </Pressable>
          ) : null}
        </Animated.View>
      ) : (
        <EmptyState
          icon={<CalendarHeart size={24} color={t.primaryText} />}
          title="No celebrations yet"
          body="Add your events to build a day-of agenda."
          action="Back"
          onAction={() => router.back()}
        />
      )}
    </Screen>
  );
}
