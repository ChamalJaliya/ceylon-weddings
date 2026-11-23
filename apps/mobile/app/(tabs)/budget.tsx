import { useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ChevronDown, Wallet } from "lucide-react-native";
import { Bar, CountUp, Donut, Rise } from "@/components/motion";
import { TAB_BAR_SPACE } from "@/components/tabbar";
import {
  Body,
  Card,
  DataList,
  Display,
  EmptyState,
  ErrorNote,
  Eyebrow,
  Screen,
  ScreenSkeleton,
  Section,
  tap,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatLkr, titleCase } from "@/lib/format";
import { font, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

function Chevron({ open }: { open: boolean }) {
  const t = useTheme();
  const s = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(open ? "180deg" : "0deg", { duration: 220 }) }],
  }));
  return (
    <Animated.View style={s}>
      <ChevronDown size={18} color={t.muted} />
    </Animated.View>
  );
}

export default function Budget() {
  const t = useTheme();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const { data, error, loading, refreshing, refresh, reload } = useQuery(async () => {
    const [w, lines] = await Promise.all([api.wedding(), api.budget()]);
    return { cap: w.budgetLkr, lines };
  });

  if (loading && !data) return <ScreenSkeleton />;
  const lines = data?.lines ?? [];
  const planned = lines.reduce((s, l) => s + l.plannedLkr, 0);
  const spent = lines.reduce((s, l) => s + l.spentLkr, 0);
  const paid = lines.reduce((s, l) => s + l.paidLkr, 0);
  const cap = data?.cap || planned;
  const left = cap - spent;

  const cats = [
    ...lines
      .reduce((m, l) => m.set(l.category, [...(m.get(l.category) ?? []), l]), new Map<string, typeof lines>())
      .entries(),
  ]
    .map(([category, items], i) => ({
      category,
      items,
      color: t.chart[i % t.chart.length]!,
      spent: items.reduce((s, l) => s + l.spentLkr, 0),
      planned: items.reduce((s, l) => s + l.plannedLkr, 0),
    }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <Screen
      eyebrow="Planning · LKR"
      title="Budget"
      bottomSpace={TAB_BAR_SPACE}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
    >
      {error ? <ErrorNote message={error} onRetry={reload} /> : null}

      <Rise index={0}>
        <Card style={{ alignItems: "center", gap: 18, paddingVertical: 24 }}>
          <Donut
            size={210}
            stroke={18}
            segments={[
              ...cats.map((c) => ({ value: c.spent, color: c.color })),
              { value: Math.max(0, left), color: "transparent" },
            ]}
          >
            <Eyebrow size={9}>Spent</Eyebrow>
            <CountUp
              value={spent}
              format={(n) => formatLkr(n)}
              style={{ fontFamily: font.display, fontSize: 36, color: t.heading, lineHeight: 40 }}
              duration={1200}
            />
            <Body muted size={12}>
              of {formatLkr(cap)}
            </Body>
          </Donut>
          <View
            style={{
              flexDirection: "row",
              alignSelf: "stretch",
              borderTopWidth: 1,
              borderTopColor: t.border,
              paddingTop: 16,
            }}
          >
            {[
              ["Paid", paid, t.success],
              ["Owed", Math.max(0, spent - paid), spent - paid > 0 ? t.warning : t.heading],
              [left >= 0 ? "Remaining" : "Over", Math.abs(left), left >= 0 ? t.heading : t.danger],
            ].map(([label, value, color], i) => (
              <View
                key={label as string}
                style={{ flex: 1, alignItems: "center", borderLeftWidth: i ? 1 : 0, borderLeftColor: t.border }}
              >
                <Eyebrow size={9}>{label as string}</Eyebrow>
                <CountUp
                  value={value as number}
                  format={(n) => formatLkr(n)}
                  style={{ fontFamily: font.display, fontSize: 22, color: color as string, marginTop: 4 }}
                />
              </View>
            ))}
          </View>
        </Card>
      </Rise>

      {!lines.length && !error ? (
        <EmptyState
          icon={<Wallet size={24} color={t.primaryText} />}
          title="No budget lines yet"
          body="Add your categories on ceylonweddings.com and they'll appear here."
        />
      ) : null}

      {cats.length ? (
        <Section title="By category">
          <View style={{ gap: 10 }}>
            {cats.map((c, i) => {
              const over = c.planned > 0 && c.spent > c.planned;
              const isOpen = openCat === c.category;
              return (
                <Rise key={c.category} index={i + 1}>
                  <Animated.View layout={LinearTransition.duration(280)}>
                    <Card padded={false} style={{ overflow: "hidden" }}>
                      <Pressable
                        onPress={() => {
                          tap();
                          setOpenCat(isOpen ? null : c.category);
                        }}
                        style={{ padding: 16, gap: 12 }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color }} />
                          <Display size={20} style={{ flex: 1 }}>
                            {titleCase(c.category)}
                          </Display>
                          <Text
                            style={{ fontFamily: font.sansMedium, fontSize: 13, color: over ? t.danger : t.heading }}
                          >
                            {formatLkr(c.spent)}
                          </Text>
                          <Chevron open={isOpen} />
                        </View>
                        <Bar value={c.planned ? c.spent / c.planned : 0} color={over ? t.danger : c.color} />
                        <Body muted size={12}>
                          {over
                            ? `${formatLkr(c.spent - c.planned)} over plan`
                            : `${formatLkr(Math.max(0, c.planned - c.spent))} left of ${formatLkr(c.planned)}`}
                        </Body>
                      </Pressable>
                      {isOpen ? (
                        <Animated.View
                          entering={FadeIn.duration(200)}
                          style={{ borderTopWidth: 1, borderTopColor: t.border, padding: 12, backgroundColor: t.inset }}
                        >
                          <DataList
                            rows={c.items}
                            keyExtractor={(l) => l.id}
                            columns={[
                              {
                                key: "label",
                                title: "Line",
                                flex: 1.4,
                                render: (l) => (
                                  <View>
                                    <Body size={14} style={{ color: t.heading }} numberOfLines={1}>
                                      {l.label}
                                    </Body>
                                    <Body muted size={12}>
                                      Paid {formatLkr(l.paidLkr)}
                                    </Body>
                                  </View>
                                ),
                              },
                              {
                                key: "planned",
                                title: "Plan",
                                flex: 1,
                                numeric: true,
                                accessor: (l) => formatLkr(l.plannedLkr),
                              },
                              {
                                key: "spent",
                                title: "Spent",
                                flex: 1,
                                numeric: true,
                                accessor: (l) => formatLkr(l.spentLkr),
                              },
                            ]}
                          />
                        </Animated.View>
                      ) : null}
                    </Card>
                  </Animated.View>
                </Rise>
              );
            })}
          </View>
        </Section>
      ) : null}
    </Screen>
  );
}
