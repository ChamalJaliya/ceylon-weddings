import { useRef, useState } from "react";
import { Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarHeart, Check, ChevronLeft, Clock, MapPin } from "lucide-react-native";
import type { PublicWebsite } from "@ceylonweddings/contracts";
import { BrandLockup, BrandMark } from "@/components/brand";
import { Confetti, Rise } from "@/components/motion";
import { Sheet, type SheetRef } from "@/components/sheet";
import {
  Body,
  Button,
  Card,
  Display,
  EmptyState,
  Eyebrow,
  GlassButton,
  impact,
  MorphButton,
  Pill,
  ScreenSkeleton,
  Section,
  SheetField,
  Stepper,
  success,
  tap,
} from "@/components/ui";
import { api, type Meal } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { font, radius, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

type Reply = "CONFIRMED" | "MAYBE" | "DECLINED";
const MEALS: Meal[] = ["VEG", "FISH", "CHICKEN", "BEEF", "HALAL", "OTHER"];
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const { width: W, height: SH } = Dimensions.get("window");
const H = Math.min(620, SH * 0.78);

function RsvpFlow({
  slug,
  events,
  onDone,
}: {
  slug: string;
  events: PublicWebsite["events"];
  onDone: (attending: boolean, name: string) => void;
}) {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [plus, setPlus] = useState(0);
  const [meal, setMeal] = useState<Meal | undefined>();
  const [replies, setReplies] = useState<Record<string, Reply>>({});
  const [error, setError] = useState<string | null>(null);
  const attending = Object.values(replies).some((r) => r !== "DECLINED");
  const steps = attending ? 3 : 2;
  const canNext = step === 0 ? !!name.trim() : step === 1 ? events.every((e) => replies[e.id]) : true;

  async function submit() {
    setError(null);
    try {
      await api.rsvp(slug, {
        headName: name.trim(),
        plusCount: plus,
        meal,
        events: events.map((e) => ({ eventId: e.id, status: replies[e.id]! })),
      });
      onDone(attending, name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your RSVP");
      throw e;
    }
  }
  const next = () => {
    tap();
    if (step + 1 >= steps) return;
    setStep(step + 1);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 22 }}>
        {Array.from({ length: steps }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.primary : t.inset }}
          />
        ))}
      </View>

      <Animated.View
        key={step}
        entering={FadeInRight.duration(280)}
        exiting={FadeOutLeft.duration(150)}
        style={{ minHeight: 260, gap: 14 }}
      >
        {step === 0 ? (
          <>
            <Display size={26}>Who's replying?</Display>
            <SheetField
              label="Your name"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              autoFocus
              style={{ fontSize: 17 }}
            />
            <Stepper
              value={plus}
              onChange={setPlus}
              min={0}
              max={20}
              hint="Guests with you — partner, children, family"
            />
          </>
        ) : step === 1 ? (
          <>
            <Display size={26}>Will you be there?</Display>
            {events.map((e) => (
              <Card key={e.id} style={{ gap: 12 }}>
                <View>
                  <Eyebrow size={9} color={t.primaryText}>
                    {titleCase(e.kind)}
                  </Eyebrow>
                  <Display size={21} style={{ marginTop: 2 }}>
                    {e.name}
                  </Display>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["CONFIRMED", "MAYBE", "DECLINED"] as Reply[]).map((r) => {
                    const active = replies[e.id] === r;
                    const color = r === "CONFIRMED" ? t.success : r === "DECLINED" ? t.danger : t.warning;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => {
                          impact();
                          setReplies({ ...replies, [e.id]: r });
                        }}
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: radius.full,
                          borderWidth: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          borderColor: active ? color : t.border,
                          backgroundColor: active ? color : t.card,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: font.sansMedium,
                            fontSize: 13,
                            color: active ? t.overlay.onImageFg : t.body,
                          }}
                        >
                          {r === "CONFIRMED" ? "Joyfully" : r === "DECLINED" ? "Regretfully" : "Maybe"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Display size={26}>Any meal preference?</Display>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MEALS.map((m) => (
                <Pill
                  key={m}
                  label={m === "VEG" ? "Vegetarian" : titleCase(m)}
                  active={meal === m}
                  onPress={() => setMeal(meal === m ? undefined : m)}
                />
              ))}
            </View>
            <Body muted size={13}>
              Optional — it helps the couple plan the plates.
            </Body>
          </>
        )}
      </Animated.View>

      {error ? <Body style={{ color: t.danger, marginTop: 10 }}>{error}</Body> : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <Button label="Back" variant="outline" onPress={() => setStep(step - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          {step + 1 >= steps ? (
            <MorphButton label="Send RSVP" onPress={submit} disabled={!canNext} successLabel="Sent" />
          ) : (
            <Button label="Continue" onPress={next} disabled={!canNext} />
          )}
        </View>
      </View>
    </View>
  );
}

export default function GuestWedding() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<SheetRef>(null);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: w, error, loading, reload } = useQuery(() => api.publicWedding(slug), [slug]);
  const [sent, setSent] = useState<{ attending: boolean; name: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const heroImg = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-H, 0, H], [-H / 2, 0, H * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-H, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const heroText = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, H * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [0, H], [0, -80], Extrapolation.CLAMP) }],
  }));

  if (loading && !w) return <ScreenSkeleton />;
  if (!w) {
    const notFound = !error || /not found|404/i.test(error);
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: t.page }}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          icon={<BrandMark height={30} cutColor={t.accentBg} />}
          title="We couldn't find that wedding"
          body={notFound ? "Check the link or code on your invitation." : error!}
          action="Try again"
          onAction={() => (notFound ? router.back() : reload())}
        />
      </View>
    );
  }

  const events = [...w.events].sort((a, b) => (a.startsAt ?? "9").localeCompare(b.startsAt ?? "9"));
  const cover = w.coverImageUrl;
  const fg = cover ? t.heroFg : t.heading;

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Confetti fire={burst} />
      <View style={{ position: "absolute", zIndex: 10, top: insets.top + 8, left: 16 }}>
        <GlassButton label="Back" onPress={() => router.back()}>
          <ChevronLeft size={22} color={fg} />
        </GlassButton>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ height: H, overflow: "hidden", backgroundColor: t.inset }}>
          <Animated.View style={[{ position: "absolute", top: 0, left: 0, width: W, height: H }, heroImg]}>
            {cover ? (
              <>
                <Image source={{ uri: cover }} style={{ flex: 1 }} contentFit="cover" transition={500} />
                <LinearGradient
                  colors={[t.overlay.scrimTop, t.overlay.scrimMid, t.overlay.scrimBottom]}
                  locations={[0, 0.4, 1]}
                  style={{ position: "absolute", inset: 0 }}
                />
              </>
            ) : (
              <>
                <LinearGradient colors={[t.accentBg, t.page]} style={{ position: "absolute", inset: 0 }} />
                <Animated.View
                  entering={ZoomIn.duration(900)}
                  style={{ position: "absolute", alignSelf: "center", top: H * 0.1, opacity: 0.12 }}
                >
                  <BrandMark height={H * 0.55} cutColor={t.accentBg} />
                </Animated.View>
              </>
            )}
          </Animated.View>
          <Animated.View
            style={[
              { flex: 1, justifyContent: "flex-end", alignItems: "center", padding: 28, paddingBottom: 54 },
              heroText,
            ]}
          >
            <Animated.View entering={FadeIn.delay(150).duration(700)}>
              <Eyebrow color={cover ? t.overlay.glassChipStrong : t.muted}>Together with their families</Eyebrow>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(300).duration(280)}>
              <Display size={58} color={fg} style={{ textAlign: "center", lineHeight: 60, marginTop: 16 }}>
                {w.partnerOneName}
              </Display>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(550).duration(280)}>
              <Display
                size={40}
                color={cover ? fg : t.primaryText}
                style={{ fontFamily: font.displayItalic, marginVertical: -4 }}
              >
                &
              </Display>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(700).duration(280)}>
              <Display size={58} color={fg} style={{ textAlign: "center", lineHeight: 60 }}>
                {w.partnerTwoName}
              </Display>
            </Animated.View>
            <Animated.View
              entering={FadeIn.delay(950).duration(700)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 }}
            >
              <View style={{ width: 30, height: 1, backgroundColor: cover ? t.overlay.onImageMuted : t.primary }} />
              <Eyebrow color={fg}>{[formatDate(w.date), w.city].filter(Boolean).join("  ·  ")}</Eyebrow>
              <View style={{ width: 30, height: 1, backgroundColor: cover ? t.overlay.onImageMuted : t.primary }} />
            </Animated.View>
          </Animated.View>
        </View>

        <View
          style={{
            marginTop: -26,
            borderTopLeftRadius: radius.hero,
            borderTopRightRadius: radius.hero,
            backgroundColor: t.page,
            paddingHorizontal: 20,
            paddingTop: 8,
          }}
        >
          {sent ? (
            <Animated.View entering={ZoomIn.duration(280)} style={{ marginTop: 22 }}>
              <Card
                style={{
                  alignItems: "center",
                  paddingVertical: 26,
                  gap: 8,
                  backgroundColor: t.successSubtle,
                  borderColor: t.successSubtle,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: t.success,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={26} color={t.overlay.onImageFg} strokeWidth={3} />
                </View>
                <Display size={26} style={{ textAlign: "center" }}>
                  Thank you, {sent.name.split(" ")[0]}
                </Display>
                <Body muted style={{ textAlign: "center" }}>
                  {sent.attending
                    ? "The couple can't wait to celebrate with you."
                    : "The couple will miss you — thank you for letting them know."}
                </Body>
              </Card>
            </Animated.View>
          ) : null}

          {events.length ? (
            <Section title="Celebrations">
              <View style={{ gap: 12 }}>
                {events.map((e, i) => {
                  const where = [e.venueName, e.address].filter(Boolean).join(", ");
                  return (
                    <Rise key={e.id} index={i}>
                      <Card style={{ gap: 10 }}>
                        <Eyebrow size={10} color={t.primaryText}>
                          {titleCase(e.kind)}
                        </Eyebrow>
                        <Display size={27}>{e.name}</Display>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Clock size={15} color={t.muted} />
                          <Body size={14}>
                            {formatDate(e.startsAt)}
                            {e.startsAt ? `  ·  ${time(e.startsAt)}` : ""}
                          </Body>
                        </View>
                        {e.nekathAt ? (
                          <LinearGradient
                            colors={[t.accentBg, "transparent"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              borderRadius: radius.sm,
                              padding: 12,
                            }}
                          >
                            <CalendarHeart size={18} color={t.primaryText} />
                            <View style={{ flex: 1 }}>
                              <Eyebrow size={9} color={t.primaryText}>
                                Auspicious time
                              </Eyebrow>
                              <Text style={{ fontFamily: font.display, fontSize: 22, color: t.heading }}>
                                {time(e.nekathAt)}
                              </Text>
                            </View>
                          </LinearGradient>
                        ) : null}
                        {where ? (
                          <Pressable
                            onPress={() => {
                              tap();
                              Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(where)}`);
                            }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              borderTopWidth: 1,
                              borderTopColor: t.border,
                              paddingTop: 12,
                            }}
                          >
                            <MapPin size={15} color={t.primaryText} />
                            <Body size={14} style={{ flex: 1, color: t.heading }}>
                              {where}
                            </Body>
                            <Text style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.primaryText }}>
                              Directions →
                            </Text>
                          </Pressable>
                        ) : null}
                      </Card>
                    </Rise>
                  );
                })}
              </View>
            </Section>
          ) : null}

          {w.travelNotes ? (
            <Section title="Travel & stay">
              <Card>
                <Body size={15}>{w.travelNotes}</Body>
              </Card>
            </Section>
          ) : null}
          {w.websiteFaq ? (
            <Section title="Good to know">
              <Card>
                <Body size={15}>{w.websiteFaq}</Body>
              </Card>
            </Section>
          ) : null}

          <View style={{ alignItems: "center", marginTop: 44, opacity: 0.7 }}>
            <BrandLockup size="sm" />
          </View>
        </View>
      </Animated.ScrollView>

      {!sent ? (
        <Animated.View
          entering={FadeInDown.delay(1100).duration(280)}
          style={{ position: "absolute", left: 20, right: 20, bottom: insets.bottom + 14 }}
        >
          <Button
            label="RSVP"
            onPress={() => {
              impact();
              sheet.current?.present();
            }}
          />
        </Animated.View>
      ) : null}

      <Sheet ref={sheet} eyebrow={`${w.partnerOneName} & ${w.partnerTwoName}`}>
        <RsvpFlow
          slug={w.slug}
          events={events}
          onDone={(attending, name) => {
            sheet.current?.dismiss();
            setSent({ attending, name });
            if (attending) setTimeout(() => setBurst(Date.now()), 300);
          }}
        />
      </Sheet>
    </View>
  );
}
