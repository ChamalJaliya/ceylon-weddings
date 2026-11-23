/**
 * Photo collage + full-screen viewer (pinch / double-tap zoom, swipe between, drag down to close).
 */
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Modal, Pressable, StatusBar, Text, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { tap } from "./ui";
import { font, radius, useTheme } from "@/theme";

const { width: W, height: H } = Dimensions.get("window");

function ZoomableImage({
  uri,
  onZoomChange,
  dismissY,
}: {
  uri: string;
  onZoomChange: (zoomed: boolean) => void;
  dismissY: { value: number };
}) {
  const scale = useSharedValue(1);
  const saved = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);

  const reset = () => {
    "worklet";
    scale.value = withTiming(1, SMOOTH);
    saved.value = 1;
    tx.value = withTiming(0, SMOOTH);
    ty.value = withTiming(0, SMOOTH);
    sx.value = 0;
    sy.value = 0;
    runOnJS(onZoomChange)(false);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.8, Math.min(5, saved.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1.05) reset();
      else {
        saved.value = scale.value;
        runOnJS(onZoomChange)(true);
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (saved.value > 1) {
        tx.value = sx.value + e.translationX;
        ty.value = sy.value + e.translationY;
      } else dismissY.value = e.translationY;
    })
    .onEnd((e) => {
      if (saved.value > 1) {
        const maxX = ((saved.value - 1) * W) / 2;
        const maxY = ((saved.value - 1) * H) / 2;
        tx.value = withTiming(Math.max(-maxX, Math.min(maxX, tx.value)), SMOOTH);
        ty.value = withTiming(Math.max(-maxY, Math.min(maxY, ty.value)), SMOOTH);
        sx.value = Math.max(-maxX, Math.min(maxX, tx.value));
        sy.value = Math.max(-maxY, Math.min(maxY, ty.value));
      } else if (Math.abs(e.translationY) > 140 || Math.abs(e.velocityY) > 1200) {
        dismissY.value = withTiming(Math.sign(e.translationY) * H, { duration: 200 });
      } else dismissY.value = withTiming(0, SMOOTH);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (saved.value > 1) reset();
      else {
        scale.value = withTiming(2.5, SMOOTH);
        saved.value = 2.5;
        tx.value = withTiming((W / 2 - e.x) * 1.5, SMOOTH);
        ty.value = withTiming((H / 2 - e.y) * 1.5, SMOOTH);
        sx.value = (W / 2 - e.x) * 1.5;
        sy.value = (H / 2 - e.y) * 1.5;
        runOnJS(onZoomChange)(true);
      }
    });

  // Vertical-only pan when not zoomed so horizontal paging still works.
  const panGated = pan.activeOffsetY([-12, 12]).failOffsetX([-20, 20]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, Gesture.Exclusive(doubleTap, panGated))}>
      <Animated.View style={[{ width: W, height: H, alignItems: "center", justifyContent: "center" }, style]}>
        <Image source={{ uri }} style={{ width: W, height: H }} contentFit="contain" transition={200} />
      </Animated.View>
    </GestureDetector>
  );
}

export function PhotoViewer({
  photos,
  index,
  visible,
  onClose,
  title,
}: {
  photos: string[];
  index: number;
  visible: boolean;
  onClose: () => void;
  title?: string;
}) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index);
  const [zoomed, setZoomed] = useState(false);
  const list = useRef<FlatList<string>>(null);
  const thumbs = useRef<FlatList<string>>(null);
  const dismissY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrent(index);
      dismissY.value = 0;
    }
  }, [visible, index, dismissY]);
  useEffect(() => {
    thumbs.current?.scrollToIndex({ index: current, viewPosition: 0.5, animated: true });
  }, [current]);

  const bg = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dismissY.value), [0, 300], [1, 0.2], Extrapolation.CLAMP),
  }));
  const page = useAnimatedStyle(() => ({
    transform: [
      { translateY: dismissY.value },
      { scale: interpolate(Math.abs(dismissY.value), [0, 400], [1, 0.85], Extrapolation.CLAMP) },
    ],
  }));
  const chrome = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dismissY.value), [0, 80], [1, 0], Extrapolation.CLAMP),
  }));

  // Close once the drag-away animation finishes.
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      if (Math.abs(dismissY.value) >= H - 1) onClose();
    }, 60);
    return () => clearInterval(id);
  }, [visible, dismissY, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "#000" }, bg]} />
        <Animated.View style={[{ flex: 1 }, page]}>
          <FlatList
            ref={list}
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p, i) => `${p}-${i}`}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / W);
              if (i !== current) {
                tap();
                setCurrent(i);
              }
            }}
            renderItem={({ item }) => <ZoomableImage uri={item} onZoomChange={setZoomed} dismissY={dismissY} />}
          />
        </Animated.View>

        <Animated.View
          pointerEvents="box-none"
          style={[
            {
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              right: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
            chrome,
          ]}
        >
          <View style={{ borderRadius: 99, overflow: "hidden" }}>
            <BlurView intensity={40} tint="dark" style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ fontFamily: font.sansMedium, color: "#fff", fontSize: 13 }}>
                {title ? `${title}  ·  ` : ""}
                {current + 1} / {photos.length}
              </Text>
            </BlurView>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            hitSlop={10}
            style={{ width: 42, height: 42, borderRadius: 21, overflow: "hidden" }}
          >
            <BlurView intensity={40} tint="dark" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="#fff" />
            </BlurView>
          </Pressable>
        </Animated.View>

        {photos.length > 1 ? (
          <Animated.View style={[{ position: "absolute", bottom: insets.bottom + 14, left: 0, right: 0 }, chrome]}>
            <FlatList
              ref={thumbs}
              data={photos}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p, i) => `t-${p}-${i}`}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
              getItemLayout={(_, i) => ({ length: 58, offset: 16 + 58 * i, index: i })}
              renderItem={({ item, index: i }) => (
                <Pressable
                  onPress={() => {
                    tap();
                    setCurrent(i);
                    list.current?.scrollToIndex({ index: i, animated: true });
                  }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: i === current ? "#fff" : "transparent",
                      opacity: i === current ? 1 : 0.55,
                    }}
                    contentFit="cover"
                  />
                </Pressable>
              )}
            />
          </Animated.View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

/** 1 hero + 2 stacked + "+N" tile — the classic storefront collage. */
export function Collage({
  photos,
  onOpen,
  height = 300,
}: {
  photos: string[];
  onOpen: (i: number) => void;
  height?: number;
}) {
  const t = useTheme();
  if (!photos.length) return null;
  const tile = (i: number, style: object, overlay?: string) => (
    <Pressable
      key={i}
      onPress={() => {
        tap();
        onOpen(i);
      }}
      style={[{ overflow: "hidden", backgroundColor: t.inset }, style]}
    >
      <Image source={{ uri: photos[i] }} style={{ flex: 1 }} contentFit="cover" transition={250} />
      {overlay ? (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(11,8,6,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: font.display, fontSize: 30, color: "#fff" }}>{overlay}</Text>
          <Text style={{ fontFamily: font.sansMedium, fontSize: 11, color: "#fff", letterSpacing: 1.5 }}>VIEW ALL</Text>
        </View>
      ) : null}
    </Pressable>
  );
  if (photos.length === 1)
    return <View style={{ height, borderRadius: radius.lg, overflow: "hidden" }}>{tile(0, { flex: 1 })}</View>;
  if (photos.length === 2) {
    return (
      <View style={{ height, flexDirection: "row", gap: 4, borderRadius: radius.lg, overflow: "hidden" }}>
        {tile(0, { flex: 1 })}
        {tile(1, { flex: 1 })}
      </View>
    );
  }
  const more = photos.length - 3;
  return (
    <Animated.View
      entering={FadeIn}
      style={{ height, flexDirection: "row", gap: 4, borderRadius: radius.lg, overflow: "hidden" }}
    >
      {tile(0, { flex: 1.6 })}
      <View style={{ flex: 1, gap: 4 }}>
        {tile(1, { flex: 1 })}
        {tile(2, { flex: 1 }, more > 0 ? `+${more}` : undefined)}
      </View>
    </Animated.View>
  );
}

/** Uniform 3-column grid. */
export function PhotoGrid({
  photos,
  onOpen,
  columns = 3,
}: {
  photos: string[];
  onOpen: (i: number) => void;
  columns?: number;
}) {
  const t = useTheme();
  const size = (W - 40 - (columns - 1) * 4) / columns;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, borderRadius: radius.md, overflow: "hidden" }}>
      {photos.map((p, i) => (
        <Pressable
          key={`${p}-${i}`}
          onPress={() => {
            tap();
            onOpen(i);
          }}
        >
          <Animated.View entering={FadeIn.delay(Math.min(i, 15) * 30)}>
            <Image
              source={{ uri: p }}
              style={{ width: size, height: size, backgroundColor: t.inset }}
              contentFit="cover"
              transition={200}
            />
          </Animated.View>
        </Pressable>
      ))}
    </View>
  );
}

/** Two-column masonry with varied heights. */
export function Masonry<T>({
  items,
  render,
  gap = 12,
}: {
  items: T[];
  render: (item: T, i: number, tall: boolean) => React.ReactNode;
  gap?: number;
}) {
  const left: [T, number][] = [];
  const right: [T, number][] = [];
  items.forEach((it, i) => (i % 2 === 0 ? left : right).push([it, i]));
  return (
    <View style={{ flexDirection: "row", gap }}>
      <View style={{ flex: 1, gap }}>
        {left.map(([it, i], k) => (
          <View key={i}>{render(it, i, k % 2 === 0)}</View>
        ))}
      </View>
      <View style={{ flex: 1, gap }}>
        {right.map(([it, i], k) => (
          <View key={i}>{render(it, i, k % 2 === 1)}</View>
        ))}
      </View>
    </View>
  );
}
