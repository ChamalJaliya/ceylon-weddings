import type { ReactNode } from "react";
import { Dimensions, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { font, radius, shadow, useTheme } from "@/theme";
import { tap } from "./haptics";
import { Body, Eyebrow } from "./typography";

const MIN_TABLE_W = Dimensions.get("window").width - 40;

export type DataColumn<T> = {
  key: string;
  title: string;
  flex?: number;
  width?: number;
  align?: "left" | "center" | "right";
  numeric?: boolean;
  render?: (row: T) => ReactNode;
  /** Fallback when render is omitted — reads row[key]. */
  accessor?: (row: T) => ReactNode;
};

/**
 * Mobile data table — card shell with sticky-feel header + tappable rows.
 * Prefer this over HTML-style tables on native.
 */
export function DataList<T>({
  columns,
  rows,
  keyExtractor,
  onRowPress,
  empty,
  style,
}: {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  keyExtractor: (row: T, index: number) => string;
  onRowPress?: (row: T) => void;
  empty?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.card,
          overflow: "hidden",
        },
        t.dark ? null : shadow.card,
        style,
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View style={{ minWidth: MIN_TABLE_W, flexGrow: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
              backgroundColor: t.inset,
              gap: 8,
            }}
          >
            {columns.map((col) => (
              <View
                key={col.key}
                style={{ flex: col.width ? undefined : (col.flex ?? 1), width: col.width, alignItems: alignItems(col) }}
              >
                <Eyebrow size={9}>{col.title}</Eyebrow>
              </View>
            ))}
            {onRowPress ? <View style={{ width: 18 }} /> : null}
          </View>

          {rows.length === 0 ? (
            <View style={{ padding: 28, alignItems: "center" }}>
              {empty ?? (
                <Body muted size={13}>
                  No rows yet
                </Body>
              )}
            </View>
          ) : (
            rows.map((row, i) => {
              const key = keyExtractor(row, i);
              const content = (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.border,
                    gap: 8,
                    minHeight: 52,
                  }}
                >
                  {columns.map((col) => {
                    const value = col.render?.(row) ?? col.accessor?.(row) ?? null;
                    return (
                      <View
                        key={col.key}
                        style={{
                          flex: col.width ? undefined : (col.flex ?? 1),
                          width: col.width,
                          alignItems: alignItems(col),
                        }}
                      >
                        {typeof value === "string" || typeof value === "number" ? (
                          <Text
                            numberOfLines={2}
                            style={{
                              fontFamily: col.numeric ? font.sansMedium : font.sans,
                              fontSize: 14,
                              color: t.heading,
                              textAlign: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
                              fontVariant: col.numeric ? ["tabular-nums"] : undefined,
                            }}
                          >
                            {value}
                          </Text>
                        ) : (
                          value
                        )}
                      </View>
                    );
                  })}
                  {onRowPress ? <ChevronRight size={16} color={t.borderStrong} /> : null}
                </View>
              );
              if (!onRowPress) return <View key={key}>{content}</View>;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    tap();
                    onRowPress(row);
                  }}
                  style={({ pressed }) => ({ backgroundColor: pressed ? t.inset : "transparent" })}
                >
                  {content}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Single settings-style row for definition lists (label · value). */
export function DataRow({
  label,
  value,
  onPress,
  right,
  first,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  first?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 52,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: pressed ? t.inset : t.card,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: t.border,
      })}
    >
      <Text style={{ flex: 1, fontFamily: font.sans, fontSize: 15, color: t.muted }}>{label}</Text>
      {value ? (
        <Text style={{ fontFamily: font.sansMedium, fontSize: 15, color: t.heading }} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && !right ? <ChevronRight size={16} color={t.borderStrong} /> : null}
    </Pressable>
  );
}

function alignItems(col: {
  align?: "left" | "center" | "right";
  numeric?: boolean;
}): "flex-start" | "center" | "flex-end" {
  if (col.align === "right" || col.numeric) return "flex-end";
  if (col.align === "center") return "center";
  return "flex-start";
}
