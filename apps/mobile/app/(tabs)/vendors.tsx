import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  LinearTransition,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Menu,
  BadgeCheck,
  Columns2,
  Heart,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  Star,
  Store,
  X,
} from "lucide-react-native";
import type { Vendor } from "@ceylonweddings/contracts";
import { BrandMark } from "@/components/brand";
import { HeartPop, Shimmer } from "@/components/motion";
import { Masonry } from "@/components/gallery";
import { Sheet, type SheetRef } from "@/components/sheet";
import { TAB_BAR_SPACE } from "@/components/tabbar";
import { useToast } from "@/components/toast";
import { useDrawer } from "@/components/drawer";
import {
  Body,
  Button,
  Display,
  EmptyState,
  ErrorNote,
  Eyebrow,
  Pill,
  SearchField,
  SheetField,
  success,
  tap,
  Tabs,
  ThemedSwitch,
  Touchable,
} from "@/components/ui";
import { api, type Facet, type VendorFilters, type VendorSort } from "@/lib/api";
import { formatLkr, titleCase } from "@/lib/format";
import { font, radius, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

/** Slugs from the vendor_types migration (vt_* rows). */
const CATEGORIES: [string, string][] = [
  ["PHOTO_VIDEO", "Photo & video"],
  ["VENUE", "Venues"],
  ["BRIDAL_DRESSER", "Bridal dressers"],
  ["HAIR_MAKEUP", "Hair & makeup"],
  ["BRIDAL_WEAR", "Bridal wear"],
  ["FLORIST_DECOR", "Décor & florals"],
  ["CATERER", "Catering"],
  ["CAKE", "Cakes"],
  ["JEWELLERY", "Jewellery"],
  ["ENTERTAINMENT", "Entertainment"],
];

function VendorCard({ v, index, saved, onSave }: { v: Vendor; index: number; saved: boolean; onSave: () => void }) {
  const t = useTheme();
  const photo = v.photoUrl ?? v.photos?.[0];
  const [pop, setPop] = useState(0);
  const press = useSharedValue(1);
  const heart = useSharedValue(1);
  const open = () => {
    tap();
    router.push(`/vendor/${v.slug}`);
  };
  const like = () => {
    setPop(Date.now());
    if (!saved) onSave();
  };

  const single = Gesture.Tap()
    .maxDuration(250)
    .onBegin(() => {
      press.value = withTiming(0.97, SMOOTH);
    })
    .onFinalize(() => {
      press.value = withTiming(1, SMOOTH);
    })
    .onEnd(() => runOnJS(open)());
  const double = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => runOnJS(like)());
  const card = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));

  const heartTap = Gesture.Tap().onEnd(() => {
    heart.value = withSequence(withTiming(1.08, SMOOTH), withTiming(1, SMOOTH));
    runOnJS(onSave)();
  });

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 70).duration(280)}>
      <GestureDetector gesture={Gesture.Exclusive(double, single)}>
        <Animated.View style={[{ gap: 12 }, card]}>
          <View
            style={{ borderRadius: radius.hero, overflow: "hidden", aspectRatio: 4 / 3.2, backgroundColor: t.inset }}
          >
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ flex: 1 }}
                contentFit="cover"
                transition={300}
                recyclingKey={v.id}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.25 }}>
                <BrandMark height={70} cutColor={t.inset} />
              </View>
            )}
            <HeartPop trigger={pop} color={t.overlay.onImageFg} />
            {v.featured ? (
              <View style={{ position: "absolute", top: 14, left: 14, borderRadius: 99, overflow: "hidden" }}>
                <BlurView
                  intensity={40}
                  tint="light"
                  style={{ paddingHorizontal: 11, paddingVertical: 5, backgroundColor: t.overlay.glassChipStrong }}
                >
                  <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: t.primaryText, letterSpacing: 0.4 }}>
                    ✦ Ceylon Pick
                  </Text>
                </BlurView>
              </View>
            ) : null}
            <GestureDetector gesture={heartTap}>
              <Animated.View
                accessibilityLabel={saved ? "Saved" : "Shortlist"}
                accessibilityRole="button"
                style={[
                  {
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    overflow: "hidden",
                  },
                  heartStyle,
                ]}
              >
                <BlurView
                  intensity={40}
                  tint="light"
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: t.overlay.glassChipStrong,
                  }}
                >
                  <Heart size={19} color={t.love} fill={saved ? t.love : "transparent"} />
                </BlurView>
              </Animated.View>
            </GestureDetector>
          </View>
          <View style={{ paddingHorizontal: 4, gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Display size={23} style={{ flexShrink: 1 }}>
                {v.name}
              </Display>
              {v.verified ? <BadgeCheck size={17} color={t.primary} /> : null}
              <View style={{ flex: 1 }} />
              {v.ratingCount ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Star size={13} color={t.primary} fill={t.primary} />
                  <Body size={13} medium style={{ color: t.heading }}>
                    {v.ratingAvg?.toFixed(1)}
                  </Body>
                  <Body size={13} muted>
                    ({v.ratingCount})
                  </Body>
                </View>
              ) : null}
            </View>
            <Body muted size={13}>
              {titleCase(v.category)} · {v.city}
            </Body>
            <Body size={14} medium style={{ color: t.heading, marginTop: 2 }}>
              {v.showPricing !== false && v.startingPriceLkr ? (
                <>
                  From <Text style={{ color: t.primaryText }}>{formatLkr(v.startingPriceLkr)}</Text>
                </>
              ) : (
                "Pricing on request"
              )}
            </Body>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

type View3 = "list" | "grid" | "collage";
const SORTS: [VendorSort, string][] = [
  ["featured", "Recommended"],
  ["rating", "Top rated"],
  ["price_asc", "Price: low → high"],
  ["price_desc", "Price: high → low"],
  ["name", "A – Z"],
];
const BUDGETS: [string, number | undefined, number | undefined][] = [
  ["Under 100K", undefined, 100_000],
  ["100K – 250K", 100_000, 250_000],
  ["250K – 500K", 250_000, 500_000],
  ["500K – 1M", 500_000, 1_000_000],
  ["1M +", 1_000_000, undefined],
];
const RATINGS: [string, number | undefined][] = [
  ["Any", undefined],
  ["4.0 +", 4],
  ["4.5 +", 4.5],
];
type Filters = Omit<VendorFilters, "q" | "category" | "pageSize">;

function countActive(f: Filters) {
  return [
    f.district,
    f.minPrice != null || f.maxPrice != null,
    f.minRating,
    f.verified,
    f.featured,
    f.destination,
    f.sort && f.sort !== "featured",
  ].filter(Boolean).length;
}

/** Compact 2-up card for grid view. */
function GridCard({ v, index, saved, onSave }: { v: Vendor; index: number; saved: boolean; onSave: () => void }) {
  const t = useTheme();
  const photo = v.photoUrl ?? v.photos?.[0];
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(280)} style={{ flex: 1 }}>
      <Touchable onPress={() => router.push(`/vendor/${v.slug}`)} style={{ gap: 8 }}>
        <View style={{ borderRadius: radius.lg, overflow: "hidden", aspectRatio: 0.85, backgroundColor: t.inset }}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ flex: 1 }}
              contentFit="cover"
              transition={250}
              recyclingKey={v.id}
            />
          ) : null}
          <Pressable
            onPress={() => {
              tap();
              onSave();
            }}
            hitSlop={6}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: t.overlay.glassChipStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={15} color={t.love} fill={saved ? t.love : "transparent"} />
          </Pressable>
          {v.ratingCount ? (
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: t.overlay.glassChipStrong,
                borderRadius: 99,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <Star size={11} color={t.primary} fill={t.primary} />
              <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: t.heading }}>
                {v.ratingAvg?.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Display size={18} style={{ flexShrink: 1 }}>
              {v.name}
            </Display>
            {v.verified ? <BadgeCheck size={14} color={t.primary} /> : null}
          </View>
          <Body muted size={12} numberOfLines={1}>
            {v.city}
          </Body>
          <Body size={12} medium style={{ color: t.primaryText }}>
            {v.showPricing !== false && v.startingPriceLkr ? `From ${formatLkr(v.startingPriceLkr)}` : "On request"}
          </Body>
        </View>
      </Touchable>
    </Animated.View>
  );
}

/** Photo-led masonry tile for collage view. */
function CollageTile({ v, index, tall }: { v: Vendor; index: number; tall: boolean }) {
  const t = useTheme();
  const photo = v.photoUrl ?? v.photos?.[0];
  return (
    <Animated.View entering={FadeIn.delay(Math.min(index, 10) * 50).duration(400)}>
      <Touchable
        onPress={() => router.push(`/vendor/${v.slug}`)}
        style={{ borderRadius: radius.lg, overflow: "hidden", height: tall ? 260 : 190, backgroundColor: t.inset }}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={{ flex: 1 }} contentFit="cover" transition={250} recyclingKey={v.id} />
        ) : null}
        <LinearGradient
          colors={["transparent", t.overlay.scrimHeavy]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" }}
        />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <Text
            style={{ fontFamily: font.sansMedium, fontSize: 9, letterSpacing: 2, color: t.overlay.glassChipStrong }}
          >
            {titleCase(v.category).toUpperCase()}
          </Text>
          <Text
            numberOfLines={2}
            style={{ fontFamily: font.display, fontSize: 19, lineHeight: 21, color: t.overlay.onImageFg, marginTop: 2 }}
          >
            {v.name}
          </Text>
        </View>
      </Touchable>
    </Animated.View>
  );
}

function ViewSwitch({ value, onChange }: { value: View3; onChange: (v: View3) => void }) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      size="sm"
      items={[
        { id: "list", label: "List", icon: Rows3 },
        { id: "grid", label: "Grid", icon: LayoutGrid },
        { id: "collage", label: "Collage", icon: Columns2 },
      ]}
    />
  );
}

function FilterSheetBody({
  initial,
  base,
  districts,
  onApply,
}: {
  initial: Filters;
  base: VendorFilters;
  districts: Facet[];
  onApply: (f: Filters) => void;
}) {
  const t = useTheme();
  const [f, setF] = useState<Filters>(initial);
  const [count, setCount] = useState<number | null>(null);
  const [minText, setMinText] = useState(initial.minPrice ? String(initial.minPrice) : "");
  const [maxText, setMaxText] = useState(initial.maxPrice ? String(initial.maxPrice) : "");
  useEffect(() => setF(initial), [initial]);
  // Live result count
  useEffect(() => {
    setCount(null);
    const id = setTimeout(() => {
      api
        .vendors({ ...base, ...f, pageSize: 1 })
        .then((r) => setCount(r.total))
        .catch(() => setCount(null));
    }, 250);
    return () => clearTimeout(id);
  }, [f, base]);
  const set = (patch: Partial<Filters>) => {
    tap();
    setF((x) => ({ ...x, ...patch }));
  };
  const budgetActive = (min?: number, max?: number) => f.minPrice === min && f.maxPrice === max;

  const Toggle = ({
    label,
    hint,
    value,
    onChange,
  }: {
    label: string;
    hint: string;
    value?: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
      <View style={{ flex: 1 }}>
        <Body medium style={{ color: t.heading }}>
          {label}
        </Body>
        <Body muted size={12}>
          {hint}
        </Body>
      </View>
      <ThemedSwitch value={!!value} onValueChange={onChange} />
    </View>
  );

  return (
    <View style={{ gap: 22 }}>
      <View>
        <Eyebrow size={10} style={{ marginBottom: 10 }}>
          Sort by
        </Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SORTS.map(([v, label]) => (
            <Pill key={v} label={label} active={(f.sort ?? "featured") === v} onPress={() => set({ sort: v })} />
          ))}
        </View>
      </View>

      <View>
        <Eyebrow size={10} style={{ marginBottom: 10 }}>
          Budget (LKR)
        </Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {BUDGETS.map(([label, min, max]) => (
            <Pill
              key={label}
              label={label}
              active={budgetActive(min, max)}
              onPress={() => {
                const on = budgetActive(min, max);
                set({ minPrice: on ? undefined : min, maxPrice: on ? undefined : max });
                setMinText(on || !min ? "" : String(min));
                setMaxText(on || !max ? "" : String(max));
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <SheetField
              label="Min"
              placeholder="0"
              keyboardType="number-pad"
              value={minText}
              style={{ height: 48 }}
              onChangeText={(x) => {
                setMinText(x);
                setF((s) => ({ ...s, minPrice: x ? Number(x.replace(/\D/g, "")) : undefined }));
              }}
            />
          </View>
          <Text style={{ color: t.muted, marginBottom: 14 }}>—</Text>
          <View style={{ flex: 1 }}>
            <SheetField
              label="Max"
              placeholder="Any"
              keyboardType="number-pad"
              value={maxText}
              style={{ height: 48 }}
              onChangeText={(x) => {
                setMaxText(x);
                setF((s) => ({ ...s, maxPrice: x ? Number(x.replace(/\D/g, "")) : undefined }));
              }}
            />
          </View>
        </View>
      </View>

      {districts.length ? (
        <View>
          <Eyebrow size={10} style={{ marginBottom: 10 }}>
            District
          </Eyebrow>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {districts.slice(0, 16).map((d) => (
              <Pill
                key={d.value}
                label={d.value}
                count={d.count}
                active={f.district === d.value}
                onPress={() => set({ district: f.district === d.value ? undefined : d.value })}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <Eyebrow size={10} style={{ marginBottom: 10 }}>
          Rating
        </Eyebrow>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {RATINGS.map(([label, v]) => (
            <Pill key={label} label={label} active={f.minRating === v} onPress={() => set({ minRating: v })} />
          ))}
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: t.border }}>
        <Toggle
          label="Verified only"
          hint="Identity and business checked by our team"
          value={f.verified}
          onChange={(v) => set({ verified: v || undefined })}
        />
        <Toggle
          label="Ceylon Picks"
          hint="Featured, award-winning vendors"
          value={f.featured}
          onChange={(v) => set({ featured: v || undefined })}
        />
        <Toggle
          label="Destination weddings"
          hint="Experienced with overseas couples"
          value={f.destination}
          onChange={(v) => set({ destination: v || undefined })}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Reset"
            variant="outline"
            onPress={() => {
              setF({});
              setMinText("");
              setMaxText("");
            }}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label={
              count == null
                ? "Show vendors"
                : count === 0
                  ? "No matches"
                  : `Show ${count} vendor${count === 1 ? "" : "s"}`
            }
            disabled={count === 0}
            onPress={() => onApply(f)}
          />
        </View>
      </View>
    </View>
  );
}

export default function Vendors() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const drawer = useDrawer();
  const sheet = useRef<SheetRef>(null);
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [view, setView] = useState<View3>("list");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  useEffect(() => setCategory(params.category), [params.category]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const base = useMemo<VendorFilters>(() => ({ q: debounced || undefined, category }), [debounced, category]);
  const { data, error, loading, refreshing, refresh, reload } = useQuery(
    () => api.vendors({ ...base, ...filters, pageSize: 36 }),
    [base, filters],
  );
  const items = data?.items ?? [];
  const active = countActive(filters);

  async function save(id: string) {
    if (saved.has(id)) return;
    success();
    setSaved((s) => new Set(s).add(id));
    toast("Added to your shortlist");
    await api.shortlist(id).catch(() => {});
  }

  const chips: [string, () => void][] = [];
  if (filters.sort && filters.sort !== "featured")
    chips.push([SORTS.find((s) => s[0] === filters.sort)![1], () => setFilters((f) => ({ ...f, sort: undefined }))]);
  if (filters.minPrice != null || filters.maxPrice != null)
    chips.push([
      `${filters.minPrice ? formatLkr(filters.minPrice) : "Rs 0"} – ${filters.maxPrice ? formatLkr(filters.maxPrice) : "any"}`,
      () => setFilters((f) => ({ ...f, minPrice: undefined, maxPrice: undefined })),
    ]);
  if (filters.district) chips.push([filters.district, () => setFilters((f) => ({ ...f, district: undefined }))]);
  if (filters.minRating)
    chips.push([`${filters.minRating}+ stars`, () => setFilters((f) => ({ ...f, minRating: undefined }))]);
  if (filters.verified) chips.push(["Verified", () => setFilters((f) => ({ ...f, verified: undefined }))]);
  if (filters.featured) chips.push(["Ceylon Picks", () => setFilters((f) => ({ ...f, featured: undefined }))]);
  if (filters.destination) chips.push(["Destination", () => setFilters((f) => ({ ...f, destination: undefined }))]);

  const title = useAnimatedStyle(() => ({
    height: interpolate(y.value, [0, 70], [66, 0], Extrapolation.CLAMP),
    opacity: interpolate(y.value, [0, 50], [1, 0], Extrapolation.CLAMP),
  }));
  const headerBg = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [10, 60], [0, 1], Extrapolation.CLAMP) }));
  const headerH = 196 + (chips.length ? 44 : 0);

  const grid = useMemo(() => {
    const rows: Vendor[][] = [];
    for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
    return rows;
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: t.page }}>
      <View style={{ position: "absolute", zIndex: 5, top: 0, left: 0, right: 0, paddingTop: insets.top + 6 }}>
        <Animated.View
          style={[
            { position: "absolute", inset: 0, overflow: "hidden", borderBottomWidth: 0.5, borderBottomColor: t.border },
            headerBg,
          ]}
        >
          <BlurView
            intensity={70}
            tint={t.dark ? "dark" : "light"}
            style={{ flex: 1, backgroundColor: t.dark ? t.overlay.frostDark : t.overlay.frostLight }}
          />
        </Animated.View>
        <Animated.View style={[{ paddingHorizontal: 20, overflow: "hidden", justifyContent: "flex-end" }, title]}>
          <Eyebrow style={{ marginBottom: 4 }}>Marketplace</Eyebrow>
          <Display size={36}>Find your team</Display>
        </Animated.View>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={drawer.open}
            accessibilityLabel="Open menu"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Menu size={19} color={t.heading} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <SearchField placeholder="Search vendors" value={q} onChangeText={setQ} />
          </View>
          <Pressable
            onPress={() => {
              tap();
              sheet.current?.present();
            }}
            accessibilityLabel="Filters"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: active ? t.heading : t.border,
              backgroundColor: active ? t.heading : t.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal size={19} color={active ? t.page : t.heading} />
            {active ? (
              <Animated.View
                entering={FadeIn}
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: t.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 5,
                  borderWidth: 2,
                  borderColor: t.page,
                }}
              >
                <Text style={{ fontFamily: font.sansMedium, fontSize: 10, color: t.primaryFg }}>{active}</Text>
              </Animated.View>
            ) : null}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
        >
          <Pill label="All" active={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map(([slug, label]) => (
            <Pill key={slug} label={label} active={category === slug} onPress={() => setCategory(slug)} />
          ))}
        </ScrollView>
        {chips.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 6 }}
          >
            {chips.map(([label, clear]) => (
              <Animated.View key={label} entering={FadeIn} layout={LinearTransition}>
                <Pressable
                  onPress={() => {
                    tap();
                    clear();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: t.accentBg,
                    borderRadius: 99,
                    paddingLeft: 12,
                    paddingRight: 8,
                    height: 30,
                  }}
                >
                  <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.primaryText }}>{label}</Text>
                  <X size={13} color={t.primaryText} />
                </Pressable>
              </Animated.View>
            ))}
            <Pressable
              onPress={() => {
                tap();
                setFilters({});
              }}
              style={{ height: 30, justifyContent: "center", paddingHorizontal: 8 }}
            >
              <Text style={{ fontFamily: font.sansMedium, fontSize: 12, color: t.muted }}>Clear all</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControlLike refreshing={refreshing} onRefresh={refresh} offset={insets.top + headerH} />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + headerH,
          paddingBottom: TAB_BAR_SPACE,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <Body muted size={13}>
            {loading && !data ? "Loading…" : `${data?.total ?? items.length} vendors`}
          </Body>
          <ViewSwitch value={view} onChange={setView} />
        </View>
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}

        {loading && !data ? (
          <View style={{ gap: 20 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 10 }}>
                <Shimmer height={270} r={radius.hero} />
                <Shimmer height={22} width="60%" />
              </View>
            ))}
          </View>
        ) : !items.length && !error ? (
          <EmptyState
            icon={<Store size={24} color={t.primaryText} />}
            title="No vendors match"
            body="Try loosening your filters."
            action={category || q || active ? "Clear everything" : undefined}
            onAction={() => {
              setCategory(undefined);
              setQ("");
              setFilters({});
            }}
          />
        ) : view === "list" ? (
          <View style={{ gap: 30 }}>
            {items.map((v, i) => (
              <VendorCard key={v.id} v={v} index={i} saved={saved.has(v.id)} onSave={() => save(v.id)} />
            ))}
          </View>
        ) : view === "grid" ? (
          <View style={{ gap: 20 }}>
            {grid.map((row, r) => (
              <View key={r} style={{ flexDirection: "row", gap: 12 }}>
                {row.map((v, c) => (
                  <GridCard key={v.id} v={v} index={r * 2 + c} saved={saved.has(v.id)} onSave={() => save(v.id)} />
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
        ) : (
          <Masonry items={items} gap={10} render={(v, i, tall) => <CollageTile v={v} index={i} tall={tall} />} />
        )}
      </Animated.ScrollView>

      <Sheet ref={sheet} eyebrow="Vendors" title="Filters" snapPoints={["88%"]}>
        <FilterSheetBody
          initial={filters}
          base={base}
          districts={data?.districts ?? []}
          onApply={(f) => {
            success();
            setFilters(f);
            sheet.current?.dismiss();
          }}
        />
      </Sheet>
    </View>
  );
}

function RefreshControlLike({
  refreshing,
  onRefresh,
  offset,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  offset: number;
}) {
  const t = useTheme();
  return (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} progressViewOffset={offset} />
  );
}
