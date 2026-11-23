import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font, radius, useTheme } from "@/theme";
import { Shimmer } from "../motion";
import { Button } from "./button";
import { Body, Display } from "./typography";

export const Skeleton = Shimmer;

export function ScreenSkeleton() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.page, padding: 20, gap: 14 }}>
      <Skeleton width={90} height={10} style={{ marginTop: 12 }} />
      <Skeleton width="65%" height={34} />
      <Skeleton height={190} r={radius.hero} style={{ marginTop: 10 }} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Skeleton height={96} r={radius.lg} style={{ flex: 1 }} width="48%" />
        <Skeleton height={96} r={radius.lg} style={{ flex: 1 }} width="48%" />
      </View>
      <Skeleton height={72} r={radius.lg} />
      <Skeleton height={72} r={radius.lg} />
    </SafeAreaView>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
  icon,
}: {
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 20, gap: 8 }}>
      {icon ? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.accentBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          {icon}
        </View>
      ) : null}
      <Display size={22} style={{ textAlign: "center" }}>
        {title}
      </Display>
      {body ? (
        <Body muted style={{ textAlign: "center" }}>
          {body}
        </Body>
      ) : null}
      {action ? (
        <View style={{ marginTop: 10, minWidth: 180 }}>
          <Button label={action} onPress={onAction ?? (() => {})} variant="outline" size="md" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.dangerSubtle,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Body style={{ flex: 1, color: t.danger }} size={14}>
        {message}
      </Body>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={10}>
          <Text style={{ fontFamily: font.sansMedium, color: t.danger }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
