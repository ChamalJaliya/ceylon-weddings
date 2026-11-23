/**
 * Home dashboard widgets — bento layout, smooth eased motion (no springs).
 */
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Clock4,
  CreditCard,
  HeartHandshake,
  Plus,
  Sparkles,
  Utensils,
} from "lucide-react-native";
import type { Appointment, BudgetLine, MineWedding } from "@ceylonweddings/contracts";
import { BrandMark } from "./brand";
import { CountUp, Ring } from "./motion";
import { Carousel } from "./ui/carousel";
import { tap } from "./ui/haptics";
import { formatLkr, titleCase } from "@/lib/format";
import { font, radius, shadow, useTheme } from "@/theme";

const ease = { duration: 900, easing: Easing.bezier(0.22, 1, 0.36, 1) };

/* ── building blocks ───────────────────────────────────────────────────── */

function Widget({
  children,
  onPress,
  style,
  delay = 0,
  padded = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: object;
  delay?: number;
  padded?: boolean;
}) {
  const t = useTheme();
  const body = (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: radius.xl,
          borderWidth: 0.5,
          borderColor: t.border,
          padding: padded ? 18 : 0,
          overflow: "hidden",
        },
        t.dark ? null : shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}
      style={{ flex: (style as { flex?: number })?.flex }}
    >
      {onPress ? (
        <Pressable
          onPress={() => {
            tap();
            onPress();
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Animated.View>
  );
}

function Head({ icon, label, action }: { icon: ReactNode; label: string; action?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          backgroundColor: t.accentBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text style={{ flex: 1, fontFamily: font.sansMedium, fontSize: 11, letterSpacing: 2.2, color: t.muted }}>
        {label.toUpperCase()}
      </Text>
      {action ? <ArrowUpRight size={16} color={t.muted} /> : null}
    </View>
  );
}

function GrowBar({
  value,
  color,
  height = 6,
  delay = 0,
  track,
}: {
  value: number;
  color: string;
  height?: number;
  delay?: number;
  track?: string;
}) {
  const t = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, value || 0)), ease));
  }, [value, delay, w]);
  const s = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? t.inset, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", borderRadius: height, backgroundColor: color }, s]} />
    </View>
  );
}

/* ── 1. Live countdown ─────────────────────────────────────────────────── */

function Digit({ value, color }: { value: string; color: string }) {
  return (
    <View style={{ overflow: "hidden", height: 46 }}>
      <Animated.Text
        key={value}
        entering={FadeInDown.duration(380)}
        exiting={FadeOutUp.duration(300)}
        style={{ fontFamily: font.display, fontSize: 44, lineHeight: 46, color, fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

export function CountdownWidget({
  at,
  name,
  nekath,
}: {
  at: string | null | undefined;
  name?: string | null;
  nekath?: string | null;
}) {
  const t = useTheme();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!at) return null;
  const diff = Math.max(0, new Date(at).getTime() - now);
  const d = Math.floor(diff / 864e5),
    h = Math.floor((diff % 864e5) / 36e5),
    m = Math.floor((diff % 36e5) / 6e4),
    s = Math.floor((diff % 6e4) / 1000);
  const fg = t.dark ? t.heading : "#fffefb";
  const unit = (v: number, label: string, pad = 2) => (
    <View style={{ alignItems: "center", minWidth: 58 }}>
      <View style={{ flexDirection: "row" }}>
        {String(v)
          .padStart(pad, "0")
          .split("")
          .map((c, i) => (
            <Digit key={i} value={c} color={fg} />
          ))}
      </View>
      <Text
        style={{ fontFamily: font.sansMedium, fontSize: 9, letterSpacing: 2, color: fg, opacity: 0.7, marginTop: 2 }}
      >
        {label}
      </Text>
    </View>
  );
  const sep = <Text style={{ fontFamily: font.display, fontSize: 30, color: fg, opacity: 0.35, marginTop: 4 }}>:</Text>;
  return (
    <Widget padded={false} delay={0}>
      <LinearGradient
        colors={t.dark ? ["#2a2119", "#15100c"] : ["#9a6a1e", "#664412"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View style={{ position: "absolute", right: -30, bottom: -40, opacity: 0.12 }}>
          <BrandMark height={170} color={fg} cutColor={t.dark ? "#1f1812" : "#80571a"} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#8cc79a" }} />
          <Text style={{ fontFamily: font.sansMedium, fontSize: 10, letterSpacing: 2.4, color: fg, opacity: 0.8 }}>
            COUNTING DOWN TO
          </Text>
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 26, color: fg, marginTop: 4 }} numberOfLines={1}>
          {name ?? "The big day"}
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 16 }}
        >
          {unit(d, "DAYS", d > 99 ? 3 : 2)}
          {sep}
          {unit(h, "HRS")}
          {sep}
          {unit(m, "MIN")}
          {sep}
          {unit(s, "SEC")}
        </View>
        {nekath ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 0.5,
              borderTopColor: "rgba(255,254,251,0.25)",
            }}
          >
            <Clock4 size={14} color={fg} />
            <Text style={{ fontFamily: font.sans, fontSize: 13, color: fg, opacity: 0.85 }}>
              Nekath at{" "}
              <Text style={{ fontFamily: font.sansMedium }}>
                {new Date(nekath).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </Text>
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </Widget>
  );
}

/* ── 2. Readiness score ────────────────────────────────────────────────── */

export function ReadinessWidget({ w }: { w: MineWedding }) {
  const t = useTheme();
  const s = w.hubStats;
  if (!s) return null;
  const areas = [
    {
      label: "Checklist",
      v: s.tasksDone / Math.max(1, s.tasksDone + s.tasksOpen),
      color: t.success,
      href: "/checklist",
      detail: `${s.tasksDone}/${s.tasksDone + s.tasksOpen}`,
    },
    {
      label: "Guests",
      v: s.rsvpConfirmed / Math.max(1, s.rsvpTotal),
      color: t.info,
      href: "/guests",
      detail: `${s.rsvpConfirmed}/${s.rsvpTotal}`,
    },
    {
      label: "Vendors",
      v: s.teamBooked / Math.max(1, s.teamTotal || s.teamBooked + s.missingCategories.length),
      color: t.love,
      href: "/vendors",
      detail: `${s.teamBooked} booked`,
    },
    {
      label: "Budget",
      v: s.budgetCapLkr ? Math.min(1, s.budgetSpentLkr / s.budgetCapLkr) : 0,
      color: s.budgetSpentLkr > s.budgetCapLkr ? t.danger : t.primary,
      href: "/budget",
      detail: `${Math.round((s.budgetSpentLkr / Math.max(1, s.budgetCapLkr)) * 100)}% used`,
    },
  ];
  const c = w.completeness;
  const score =
    c && c.total > 0
      ? Math.round((c.score / c.total) * 100)
      : Math.round((areas.slice(0, 3).reduce((a, x) => a + x.v, 0) / 3) * 100);
  const mood =
    score >= 85
      ? "Practically ready ✦"
      : score >= 60
        ? "Looking wonderful"
        : score >= 30
          ? "Great momentum"
          : "Just getting started";
  return (
    <Widget delay={80}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <Ring value={score / 100} size={104} stroke={9} color={t.primary}>
          <CountUp value={score} style={{ fontFamily: font.display, fontSize: 34, color: t.heading, lineHeight: 36 }} />
          <Text style={{ fontFamily: font.sansMedium, fontSize: 8, letterSpacing: 1.8, color: t.muted }}>READY</Text>
        </Ring>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 10, letterSpacing: 2.2, color: t.muted }}>
            WEDDING READINESS
          </Text>
          <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 26, color: t.heading }}>{mood}</Text>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>
            {s.tasksOpen} tasks · {s.rsvpTotal - s.rsvpConfirmed} RSVPs pending
          </Text>
        </View>
      </View>
      <View style={{ gap: 12, marginTop: 18 }}>
        {areas.map((a, i) => (
          <Pressable
            key={a.label}
            onPress={() => {
              tap();
              router.navigate(a.href as never);
            }}
            style={{ gap: 6 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.heading }}>{a.label}</Text>
              <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>{a.detail}</Text>
            </View>
            <GrowBar value={a.v} color={a.color} delay={200 + i * 90} />
          </Pressable>
        ))}
      </View>
    </Widget>
  );
}

/* ── 3. Guests (bento tall) ────────────────────────────────────────────── */

export function GuestsWidget({ w }: { w: MineWedding }) {
  const t = useTheme();
  const g = w.guestSummary;
  const heads = g?.heads ?? w.hubStats?.rsvpTotal ?? 0;
  const side = (k: "BRIDE" | "GROOM" | "BOTH") => g?.bySide.find((x) => x.side === k)?.heads ?? 0;
  const st = (k: string) => g?.byStatus.filter((x) => x.status === k).reduce((a, x) => a + x.heads, 0) ?? 0;
  const bride = side("BRIDE"),
    groom = side("GROOM"),
    both = side("BOTH");
  const total = Math.max(1, bride + groom + both);
  return (
    <Widget onPress={() => router.navigate("/guests")} delay={160} style={{ flex: 1, minHeight: 236 }}>
      <Head icon={<HeartHandshake size={15} color={t.primaryText} />} label="Guests" action />
      <CountUp value={heads} style={{ fontFamily: font.display, fontSize: 46, lineHeight: 48, color: t.heading }} />
      <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>
        people · {g?.households ?? 0} households
      </Text>
      <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 16, gap: 2 }}>
        <View style={{ flex: bride / total || 0.001, backgroundColor: t.love }} />
        <View style={{ flex: groom / total || 0.001, backgroundColor: t.info }} />
        <View style={{ flex: both / total || 0.001, backgroundColor: t.primary }} />
      </View>
      <View style={{ gap: 6, marginTop: 12 }}>
        {[
          ["Bride", bride, t.love],
          ["Groom", groom, t.info],
          ["Both", both, t.primary],
        ].map(([l, n, c]) => (
          <View key={l as string} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c as string }} />
            <Text style={{ flex: 1, fontFamily: font.sans, fontSize: 12, color: t.body }}>{l as string}</Text>
            <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.heading }}>{n as number}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
        <View style={{ flex: 1, backgroundColor: t.successSubtle, borderRadius: 10, padding: 8 }}>
          <Text style={{ fontFamily: font.display, fontSize: 20, color: t.success }}>{st("CONFIRMED")}</Text>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 9, letterSpacing: 1, color: t.success }}>YES</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: t.warningSubtle, borderRadius: 10, padding: 8 }}>
          <Text style={{ fontFamily: font.display, fontSize: 20, color: t.warning }}>
            {st("INVITED") + st("MAYBE") + st("CONSIDERING")}
          </Text>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 9, letterSpacing: 1, color: t.warning }}>WAITING</Text>
        </View>
      </View>
    </Widget>
  );
}

/* ── 4. Next appointment (bento small) ─────────────────────────────────── */

function relative(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 6e4);
  if (mins < 60) return `in ${Math.max(1, mins)} min`;
  if (mins < 60 * 24) return `in ${Math.round(mins / 60)} hr`;
  const d = Math.round(mins / 1440);
  return d === 1 ? "tomorrow" : `in ${d} days`;
}

export function NextAppointmentWidget({ appts }: { appts: Appointment[] }) {
  const t = useTheme();
  const next = appts
    .filter((a) => new Date(a.startsAt).getTime() > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  return (
    <Widget onPress={() => router.push("/calendar")} delay={220} style={{ flex: 1 }}>
      <Head icon={<CalendarClock size={15} color={t.primaryText} />} label="Next up" />
      {next ? (
        <>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: t.infoSubtle,
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginBottom: 6,
            }}
          >
            <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: t.info }}>{relative(next.startsAt)}</Text>
          </View>
          <Text numberOfLines={2} style={{ fontFamily: font.display, fontSize: 19, lineHeight: 21, color: t.heading }}>
            {next.title}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: font.sans, fontSize: 12, color: t.muted, marginTop: 4 }}>
            {new Date(next.startsAt).toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            · {new Date(next.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </Text>
        </>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: font.display, fontSize: 19, color: t.heading }}>Nothing booked</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Plus size={13} color={t.primaryText} />
            <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.primaryText }}>Add one</Text>
          </View>
        </View>
      )}
    </Widget>
  );
}

/* ── 5. Payments due (bento small) ─────────────────────────────────────── */

export function PaymentsWidget({ lines }: { lines: BudgetLine[] }) {
  const t = useTheme();
  const due = lines
    .flatMap((l) => [
      l.depositDueAt
        ? { at: l.depositDueAt, label: `${l.label} deposit`, amount: Math.max(0, l.spentLkr - l.paidLkr) }
        : null,
      l.balanceDueAt
        ? { at: l.balanceDueAt, label: `${l.label} balance`, amount: Math.max(0, l.spentLkr - l.paidLkr) }
        : null,
    ])
    .filter(
      (x): x is { at: string; label: string; amount: number } =>
        !!x && x.amount > 0 && new Date(x.at).getTime() > Date.now() - 864e5 * 30,
    )
    .sort((a, b) => a.at.localeCompare(b.at));
  const owed = lines.reduce((s, l) => s + Math.max(0, l.spentLkr - l.paidLkr), 0);
  const next = due[0];
  const overdue = next && new Date(next.at).getTime() < Date.now();
  return (
    <Widget onPress={() => router.navigate("/budget")} delay={280} style={{ flex: 1 }}>
      <Head icon={<CreditCard size={15} color={t.primaryText} />} label="Payments" />
      {next ? (
        <>
          <Text style={{ fontFamily: font.display, fontSize: 22, color: overdue ? t.danger : t.heading }}>
            {formatLkr(next.amount)}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>
            {next.label}
          </Text>
          <Text
            style={{ fontFamily: font.sansMedium, fontSize: 11, color: overdue ? t.danger : t.warning, marginTop: 4 }}
          >
            {overdue
              ? "Overdue"
              : `Due ${new Date(next.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontFamily: font.display, fontSize: 22, color: t.heading }}>{formatLkr(owed)}</Text>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>
            {owed ? "still to pay" : "all settled ✓"}
          </Text>
        </>
      )}
    </Widget>
  );
}

/* ── 6. Your team ──────────────────────────────────────────────────────── */

export function TeamWidget({ w }: { w: MineWedding }) {
  const t = useTheme();
  const team = [...w.team].sort((a, b) => (a.status === "BOOKED" ? -1 : 1) - (b.status === "BOOKED" ? -1 : 1));
  const booked = team.filter((v) => v.status === "BOOKED");
  const missing = w.hubStats?.missingCategories ?? [];
  const tone = (s: string) =>
    s === "BOOKED" ? [t.successSubtle, t.success] : s === "INQUIRED" ? [t.infoSubtle, t.info] : [t.inset, t.muted];
  return (
    <Widget delay={340}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <View>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 11, letterSpacing: 2.2, color: t.muted }}>
            YOUR TEAM
          </Text>
          <Text style={{ fontFamily: font.display, fontSize: 22, color: t.heading, marginTop: 2 }}>
            {booked.length} booked · {team.length - booked.length} in talks
          </Text>
        </View>
        {/* overlapping avatar stack */}
        <View style={{ flexDirection: "row" }}>
          {booked.slice(0, 4).map((v, i) => (
            <View
              key={v.vendorId}
              style={{
                marginLeft: i ? -12 : 0,
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 2,
                borderColor: t.card,
                overflow: "hidden",
                backgroundColor: t.inset,
              }}
            >
              {(v.photoUrl ?? v.photos?.[0]) ? (
                <Image source={{ uri: (v.photoUrl ?? v.photos?.[0])! }} style={{ flex: 1 }} contentFit="cover" />
              ) : null}
            </View>
          ))}
        </View>
      </View>
      {team.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -18 }}
          contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
        >
          {team.map((v) => {
            const [bg, fg] = tone(v.status);
            const photo = v.photoUrl ?? v.photos?.[0];
            return (
              <Pressable
                key={v.vendorId}
                onPress={() => {
                  tap();
                  router.push(`/vendor/${v.slug}`);
                }}
                style={{ width: 132 }}
              >
                <View style={{ height: 96, borderRadius: 14, overflow: "hidden", backgroundColor: t.inset }}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ flex: 1 }} contentFit="cover" transition={200} />
                  ) : null}
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      backgroundColor: bg,
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontFamily: font.sansMedium, fontSize: 10, color: fg }}>{titleCase(v.status)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{ flexShrink: 1, fontFamily: font.sansMedium, fontSize: 13, color: t.heading }}
                  >
                    {v.name}
                  </Text>
                  {v.status === "BOOKED" ? <BadgeCheck size={13} color={t.success} /> : null}
                </View>
                <Text numberOfLines={1} style={{ fontFamily: font.sans, fontSize: 11, color: t.muted }}>
                  {titleCase(v.category)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {missing.length ? (
        <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: t.border }}>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted, marginBottom: 8 }}>Still to book</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {missing.map((c) => (
              <Pressable
                key={c}
                onPress={() => {
                  tap();
                  router.navigate({ pathname: "/vendors", params: { category: c } } as never);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  borderWidth: 1,
                  borderColor: t.border,
                  borderStyle: "dashed",
                  borderRadius: 99,
                  paddingLeft: 10,
                  paddingRight: 8,
                  paddingVertical: 5,
                }}
              >
                <Plus size={12} color={t.primaryText} />
                <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.body }}>{titleCase(c)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Widget>
  );
}

/* ── 7. Plates & meals ─────────────────────────────────────────────────── */

export function PlatesWidget({ w }: { w: MineWedding }) {
  const t = useTheme();
  const p = w.plateSummary;
  if (!p || !p.byMeal.length) return null;
  const max = Math.max(1, ...p.byMeal.map((m) => m.heads));
  const colors = t.chart;
  return (
    <Widget delay={400} onPress={() => router.navigate("/guests")}>
      <Head icon={<Utensils size={15} color={t.primaryText} />} label="Plates" action />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 18 }}>
        <View>
          <CountUp
            value={p.estimate}
            style={{ fontFamily: font.display, fontSize: 40, lineHeight: 42, color: t.heading }}
          />
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: t.muted }}>estimated</Text>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.success, marginTop: 6 }}>
            {p.confirmedHeads} confirmed
          </Text>
          {p.bufferGap > 0 ? (
            <Text style={{ fontFamily: font.sans, fontSize: 11, color: t.warning }}>+{p.bufferGap} buffer</Text>
          ) : null}
        </View>
        {/* vertical bar chart by meal */}
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 96 }}
        >
          {p.byMeal.map((m, i) => (
            <MealBar
              key={m.meal ?? "none"}
              label={m.meal ? titleCase(m.meal).slice(0, 4) : "TBC"}
              heads={m.heads}
              pct={m.heads / max}
              color={colors[i % colors.length]!}
              delay={450 + i * 80}
            />
          ))}
        </View>
      </View>
    </Widget>
  );
}

function MealBar({
  label,
  heads,
  pct,
  color,
  delay,
}: {
  label: string;
  heads: number;
  pct: number;
  color: string;
  delay: number;
}) {
  const t = useTheme();
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(pct, ease));
  }, [pct, delay, h]);
  const s = useAnimatedStyle(() => ({ height: `${Math.max(0.06, h.value) * 100}%` }));
  return (
    <View style={{ alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
      <Text style={{ fontFamily: font.sansMedium, fontSize: 10, color: t.heading }}>{heads}</Text>
      <View style={{ width: 14, flex: 1, justifyContent: "flex-end", maxHeight: 64 }}>
        <Animated.View style={[{ width: 14, borderRadius: 7, backgroundColor: color }, s]} />
      </View>
      <Text style={{ fontFamily: font.sans, fontSize: 9, color: t.muted }}>{label}</Text>
    </View>
  );
}

/* ── 8. Tip of the day ─────────────────────────────────────────────────── */

const TIPS = [
  "Confirm your Poruwa ceremony master's timing against the nekath at least a month ahead.",
  "Share the RSVP link on WhatsApp family groups — most replies come within 48 hours.",
  "Ask your photographer for a shot list that includes the Ashtaka and the milk-rice moment.",
  "Book guest transport early if your venue is outside Colombo — coaches sell out in December.",
  "Keep a 10% buffer on plates for walk-in relatives; it's a Sri Lankan wedding after all.",
];

export function TipWidget() {
  const t = useTheme();
  const start = new Date().getDate() % TIPS.length;
  const tips = [...TIPS.slice(start), ...TIPS.slice(0, start)];
  return (
    <View style={{ marginHorizontal: -20 }}>
      <Carousel peek={20} gap={12}>
        {tips.map((tip, i) => (
          <Widget key={i} delay={460} style={{ backgroundColor: t.accentBg, borderColor: t.accentBg }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Sparkles size={18} color={t.primaryText} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.sansMedium, fontSize: 10, letterSpacing: 2.2, color: t.primaryText }}>
                  PLANNER'S TIP
                </Text>
                <Text
                  style={{
                    fontFamily: font.displayItalic,
                    fontSize: 18,
                    lineHeight: 24,
                    color: t.heading,
                    marginTop: 4,
                  }}
                >
                  {tip}
                </Text>
              </View>
            </View>
          </Widget>
        ))}
      </Carousel>
    </View>
  );
}
