import { useState, type ReactNode } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme";
import { SMOOTH_FAST } from "@/theme/motion";
import { tap } from "./haptics";

const SCREEN_W = Dimensions.get("window").width;

/**
 * Horizontal pager with snap + animated page dots.
 * Pass equal-width children (cards, tips, recommendations).
 */
export function Carousel({
  children,
  gap = 14,
  peek = 28,
  style,
  onIndexChange,
}: {
  children: ReactNode[];
  gap?: number;
  /** Side inset so the next card peeks. */
  peek?: number;
  style?: StyleProp<ViewStyle>;
  onIndexChange?: (i: number) => void;
}) {
  const t = useTheme();
  const [index, setIndex] = useState(0);
  const cardW = SCREEN_W - peek * 2;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (cardW + gap));
    if (i !== index && i >= 0 && i < children.length) {
      setIndex(i);
      onIndexChange?.(i);
    }
  };

  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardW + gap}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: peek, gap }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={() => tap()}
      >
        {children.map((child, i) => (
          <View key={i} style={{ width: cardW }}>
            {child}
          </View>
        ))}
      </ScrollView>
      {children.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {children.map((_, i) => (
            <Dot key={i} active={i === index} color={t.primary} muted={t.borderStrong} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Dot({ active, color, muted }: { active: boolean; color: string; muted: string }) {
  const w = useSharedValue(active ? 18 : 6);
  w.value = withTiming(active ? 18 : 6, SMOOTH_FAST);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: active ? color : muted }, style]} />;
}
