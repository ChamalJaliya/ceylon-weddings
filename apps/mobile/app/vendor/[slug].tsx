import { useRef, useState } from "react";
import { Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeCheck, Check, ChevronLeft, Heart, MapPin, MessageCircle, Share2, Star } from "lucide-react-native";
import { Rise } from "@/components/motion";
import { Collage, PhotoGrid, PhotoViewer } from "@/components/gallery";
import { Sheet, type SheetRef } from "@/components/sheet";
import { useToast } from "@/components/toast";
import {
  Badge,
  Body,
  Button,
  Card,
  Display,
  ErrorNote,
  Eyebrow,
  FrostedHeader,
  GlassButton,
  impact,
  Pill,
  ScreenSkeleton,
  Section,
  SheetTextarea,
  success,
  tap,
  Tabs,
  Touchable,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatLkr, titleCase } from "@/lib/format";
import { font, radius, shadow, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

const W = Dimensions.get("window").width;
const HERO = 420;

export default function VendorDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const sheet = useRef<SheetRef>(null);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: v, error, loading, reload } = useQuery(() => api.vendor(slug), [slug]);
  const [message, setMessage] = useState("");
  const [pkg, setPkg] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(0);
  const [galleryView, setGalleryView] = useState<"collage" | "grid" | "albums">("collage");
  const [viewer, setViewer] = useState<{ photos: string[]; index: number; title?: string } | null>(null);
  const y = useSharedValue(0);
  const heart = useSharedValue(1);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-HERO, 0, HERO], [-HERO / 2, 0, HERO * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-HERO, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const bar = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [HERO - 170, HERO - 110], [0, 1], Extrapolation.CLAMP),
  }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));

  if (loading && !v) return <ScreenSkeleton />;
  if (!v)
    return (
      <View style={{ flex: 1, padding: 20, paddingTop: 80, backgroundColor: t.page }}>
        <ErrorNote message={error ?? "Not found"} onRetry={reload} />
      </View>
    );

  const albums = (v.mediaProjects ?? []).filter((m) => m.items.length);
  const allPhotos = [
    ...new Set(
      [v.photoUrl, ...(v.photos ?? []), ...albums.flatMap((a) => a.items.map((i) => i.url))].filter(
        (p): p is string => !!p,
      ),
    ),
  ];
  const photos = allPhotos.slice(0, 8);
  const packages = (v.packages ?? []).filter((p) => p.status === "PUBLISHED" || !p.status);
  const chosen = packages.find((p) => p.id === pkg);

  async function inquire() {
    setSending(true);
    try {
      const body =
        message.trim() ||
        `Hi ${v!.name}, we found you on Ceylon Weddings and would love to know more${chosen ? ` about your ${chosen.name} package` : ""}.`;
      const res = await api.inquire(v!.id, body);
      success();
      sheet.current?.dismiss();
      setMessage("");
      toast("Inquiry sent");
      if (res.whatsappUrl) setTimeout(() => Linking.openURL(res.whatsappUrl!), 350);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send", "error");
    } finally {
      setSending(false);
    }
  }

  async function shortlist() {
    heart.value = withSequence(withTiming(1.08, SMOOTH), withTiming(1, SMOOTH));
    if (saved) return;
    success();
    setSaved(true);
    toast("Added to your shortlist");
    await api.shortlist(v!.id).catch(() => setSaved(false));
  }

  const price = v.showPricing !== false && v.startingPriceLkr ? formatLkr(v.startingPriceLkr) : "On request";

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ zIndex: 9 }}>
        <FrostedHeader title={v.name} animatedStyle={bar} height={58} />
      </View>
      <View
        style={{
          position: "absolute",
          zIndex: 10,
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <GlassButton label="Back" onPress={() => router.back()}>
          <ChevronLeft size={22} color={t.overlay.onImageFg} />
        </GlassButton>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <GlassButton label="Share" onPress={() => toast("Link copied", "info")}>
            <Share2 size={18} color={t.overlay.onImageFg} />
          </GlassButton>
          <Animated.View style={heartStyle}>
            <GlassButton label="Shortlist" onPress={shortlist}>
              <Heart size={19} color={t.overlay.onImageFg} fill={saved ? t.overlay.onImageFg : "transparent"} />
            </GlassButton>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View style={{ height: HERO, overflow: "hidden", backgroundColor: t.inset }}>
          <Animated.View style={[{ width: W, height: HERO }, heroStyle]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setPage(Math.round(e.nativeEvent.contentOffset.x / W));
                tap();
              }}
            >
              {photos.map((p, i) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    tap();
                    setViewer({ photos: allPhotos, index: i });
                  }}
                >
                  <Image source={{ uri: p }} style={{ width: W, height: HERO }} contentFit="cover" transition={300} />
                </Pressable>
              ))}
            </ScrollView>
            <LinearGradient
              pointerEvents="none"
              colors={[t.overlay.vignette, "transparent", t.overlay.vignette]}
              locations={[0, 0.35, 1]}
              style={{ position: "absolute", inset: 0 }}
            />
          </Animated.View>
          {allPhotos.length > 1 ? (
            <Pressable
              onPress={() => setViewer({ photos: allPhotos, index: page })}
              style={{ position: "absolute", right: 16, bottom: 40, borderRadius: 99, overflow: "hidden" }}
            >
              <BlurView intensity={40} tint="dark" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.overlay.onImageFg }}>
                  {page + 1} / {allPhotos.length} · View all
                </Text>
              </BlurView>
            </Pressable>
          ) : null}
          {photos.length > 1 ? (
            <View
              pointerEvents="none"
              style={{ position: "absolute", bottom: 42, alignSelf: "center", flexDirection: "row", gap: 6 }}
            >
              {photos.map((p, i) => (
                <View
                  key={p}
                  style={{
                    width: i === page ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === page ? t.overlay.onImageFg : t.overlay.onImageMuted,
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={{
            marginTop: -26,
            borderTopLeftRadius: radius.hero,
            borderTopRightRadius: radius.hero,
            backgroundColor: t.page,
            paddingHorizontal: 20,
            paddingTop: 26,
          }}
        >
          <Rise index={0}>
            <Eyebrow color={t.primaryText}>{titleCase(v.category)}</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Display size={38} style={{ flexShrink: 1 }}>
                {v.name}
              </Display>
              {v.verified ? <BadgeCheck size={22} color={t.primary} /> : null}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <MapPin size={14} color={t.muted} />
                <Body muted size={14}>
                  {v.city}, {v.district}
                </Body>
              </View>
              {v.ratingCount ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Star size={14} color={t.primary} fill={t.primary} />
                  <Body size={14} medium style={{ color: t.heading }}>
                    {v.ratingAvg?.toFixed(1)}
                  </Body>
                  <Body muted size={14}>
                    · {v.ratingCount} reviews
                  </Body>
                </View>
              ) : null}
            </View>
          </Rise>

          <Rise index={1}>
            <Card style={{ flexDirection: "row", marginTop: 20, paddingVertical: 16 }}>
              {[
                ["From", price],
                ["Experience", v.yearsExperience ? `${v.yearsExperience} yrs` : "—"],
                ["Couples", v.couplesServed ? `${v.couplesServed}+` : "—"],
              ].map(([label, value], i) => (
                <View
                  key={label}
                  style={{ flex: 1, alignItems: "center", borderLeftWidth: i ? 1 : 0, borderLeftColor: t.border }}
                >
                  <Eyebrow size={9}>{label}</Eyebrow>
                  <Text style={{ fontFamily: font.display, fontSize: 21, color: t.heading, marginTop: 3 }}>
                    {value}
                  </Text>
                </View>
              ))}
            </Card>
          </Rise>

          {v.offerHeadline ? (
            <Rise index={2}>
              <LinearGradient
                colors={[t.accentBg, t.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ marginTop: 14, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: t.border }}
              >
                <Eyebrow size={9} color={t.primaryText}>
                  Offer
                </Eyebrow>
                <Body medium style={{ color: t.heading, marginTop: 4 }}>
                  {v.offerHeadline}
                </Body>
              </LinearGradient>
            </Rise>
          ) : null}
          {v.description ? (
            <Rise index={3}>
              <Body style={{ marginTop: 18 }} size={15}>
                {v.description}
              </Body>
            </Rise>
          ) : null}

          {allPhotos.length > 1 ? (
            <Section
              title="Portfolio"
              action={`${allPhotos.length} photos`}
              onAction={() => setViewer({ photos: allPhotos, index: 0 })}
            >
              <View style={{ marginBottom: 14 }}>
                <Tabs
                  value={galleryView}
                  onChange={setGalleryView}
                  fill
                  items={[
                    { id: "collage", label: "Collage" },
                    { id: "grid", label: "Grid" },
                    ...(albums.length ? [{ id: "albums" as const, label: "Albums", badge: albums.length }] : []),
                  ]}
                />
              </View>
              {galleryView === "collage" ? (
                <Collage photos={allPhotos} onOpen={(i) => setViewer({ photos: allPhotos, index: i })} />
              ) : galleryView === "grid" ? (
                <PhotoGrid photos={allPhotos.slice(0, 24)} onOpen={(i) => setViewer({ photos: allPhotos, index: i })} />
              ) : (
                <View style={{ gap: 14 }}>
                  {albums.map((a, ai) => (
                    <Animated.View key={a.id} entering={FadeInDown.delay(ai * 70).duration(280)}>
                      <Touchable
                        onPress={() => setViewer({ photos: a.items.map((i) => i.url), index: 0, title: a.title })}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 3,
                            height: 150,
                            borderRadius: radius.lg,
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            source={{ uri: a.coverUrl ?? a.items[0]!.url }}
                            style={{ flex: 2 }}
                            contentFit="cover"
                            transition={250}
                          />
                          {a.items.length > 1 ? (
                            <View style={{ flex: 1, gap: 3 }}>
                              {a.items.slice(1, 3).map((it) => (
                                <Image
                                  key={it.id}
                                  source={{ uri: it.url }}
                                  style={{ flex: 1 }}
                                  contentFit="cover"
                                  transition={250}
                                />
                              ))}
                            </View>
                          ) : null}
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            marginTop: 8,
                            paddingHorizontal: 2,
                          }}
                        >
                          <Display size={19} style={{ flex: 1 }}>
                            {a.title}
                          </Display>
                          <Body muted size={12}>
                            {a.items.length} photos
                          </Body>
                        </View>
                      </Touchable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Section>
          ) : null}

          {packages.length ? (
            <Section title="Packages">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={W * 0.8 + 12}
                decelerationRate="fast"
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {packages.map((p, i) => (
                  <Animated.View key={p.id} entering={FadeInDown.delay(i * 80).duration(280)}>
                    <Touchable
                      onPress={() => {
                        setPkg(p.id);
                        impact();
                        sheet.current?.present();
                      }}
                      style={{ width: W * 0.8 }}
                    >
                      <Card style={{ gap: 10, minHeight: 240 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          {p.tier ? (
                            <Eyebrow size={9} color={t.primaryText}>
                              {titleCase(p.tier)}
                            </Eyebrow>
                          ) : (
                            <View />
                          )}
                          {p.badge ? <Badge label={titleCase(p.badge)} tone="gold" /> : null}
                        </View>
                        <Display size={25}>{p.name}</Display>
                        {v.showPricing !== false && p.priceLkr ? (
                          <Text style={{ fontFamily: font.display, fontSize: 30, color: t.primaryText }}>
                            {formatLkr(p.priceLkr)}
                          </Text>
                        ) : (
                          <Body muted>Price on request</Body>
                        )}
                        <View style={{ gap: 6 }}>
                          {p.inclusions.slice(0, 4).map((inc) => (
                            <View key={inc} style={{ flexDirection: "row", gap: 8 }}>
                              <Check size={15} color={t.success} style={{ marginTop: 3 }} />
                              <Body size={14} style={{ flex: 1 }}>
                                {inc}
                              </Body>
                            </View>
                          ))}
                        </View>
                        <Text
                          style={{ fontFamily: font.sansMedium, fontSize: 13, color: t.primaryText, marginTop: "auto" }}
                        >
                          Ask about this package →
                        </Text>
                      </Card>
                    </Touchable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {v.reviews?.length ? (
            <Section title="What couples say">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={W * 0.85 + 12}
                decelerationRate="fast"
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {v.reviews.slice(0, 6).map((r) => (
                  <Card key={r.id} style={{ width: W * 0.85, gap: 10 }}>
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          color={t.primary}
                          fill={n <= Math.round(r.rating) ? t.primary : "transparent"}
                        />
                      ))}
                    </View>
                    <Text
                      numberOfLines={6}
                      style={{ fontFamily: font.displayItalic, fontSize: 19, lineHeight: 26, color: t.heading }}
                    >
                      “{r.body}”
                    </Text>
                    <Eyebrow size={9}>{r.authorName}</Eyebrow>
                  </Card>
                ))}
              </ScrollView>
            </Section>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            borderTopWidth: 0.5,
            borderTopColor: t.border,
          },
          shadow.raised,
        ]}
      >
        <BlurView
          intensity={80}
          tint={t.dark ? "dark" : "light"}
          style={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: insets.bottom + 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: t.dark ? t.overlay.frostDark : t.overlay.frostLight,
          }}
        >
          <View style={{ flex: 1 }}>
            <Eyebrow size={9}>Starting at</Eyebrow>
            <Text style={{ fontFamily: font.display, fontSize: 24, color: t.heading }}>{price}</Text>
          </View>
          <View style={{ flex: 1.4 }}>
            <Button
              label="Inquire"
              onPress={() => {
                impact();
                sheet.current?.present();
              }}
              icon={<MessageCircle size={18} color={t.primaryFg} />}
            />
          </View>
        </BlurView>
      </View>

      <PhotoViewer
        visible={!!viewer}
        photos={viewer?.photos ?? []}
        index={viewer?.index ?? 0}
        title={viewer?.title}
        onClose={() => setViewer(null)}
      />

      <Sheet ref={sheet} eyebrow={v.name} title="Send an inquiry">
        {packages.length ? (
          <>
            <Eyebrow size={10} style={{ marginBottom: 10 }}>
              Interested in
            </Eyebrow>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20, marginBottom: 18 }}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              <Pill label="Not sure yet" active={!pkg} onPress={() => setPkg(undefined)} />
              {packages.map((p) => (
                <Pill key={p.id} label={p.name} active={pkg === p.id} onPress={() => setPkg(p.id)} />
              ))}
            </ScrollView>
          </>
        ) : null}
        <SheetTextarea
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder={`Hi ${v.name}, our date is… we're expecting around… guests and we love your…`}
          helper="We'll save this to your inquiries and open WhatsApp so you can chat directly."
        />
        <View style={{ marginTop: 20 }}>
          <Button
            label="Send on WhatsApp"
            onPress={inquire}
            loading={sending}
            icon={<MessageCircle size={18} color={t.primaryFg} />}
          />
        </View>
      </Sheet>
    </View>
  );
}
