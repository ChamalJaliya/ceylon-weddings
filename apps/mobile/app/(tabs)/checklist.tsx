import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  ZoomIn,
  withTiming,
} from "react-native-reanimated";
import { SMOOTH } from "@/theme/motion";
import { Check, Plus, Sparkles, Trash2 } from "lucide-react-native";
import type { Task } from "@ceylonweddings/contracts";
import { Confetti, Ring } from "@/components/motion";
import { Sheet, type SheetRef } from "@/components/sheet";
import { SwipeRow } from "@/components/swipe-row";
import { TAB_BAR_SPACE } from "@/components/tabbar";
import { useToast } from "@/components/toast";
import {
  Body,
  Button,
  Card,
  Display,
  EmptyState,
  ErrorNote,
  Eyebrow,
  impact,
  Screen,
  ScreenSkeleton,
  Select,
  SheetField,
  Tabs,
  success,
  tap,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/format";
import { font, shadow, useTheme } from "@/theme";
import { useQuery } from "@/lib/useQuery";

type Filter = "open" | "done" | "all";
const CATS = [
  "venue",
  "attire",
  "beauty",
  "decor",
  "tradition",
  "guests",
  "catering",
  "entertainment",
  "legal",
  "travel",
];
const addDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString();
const DUE = [
  ["Today", 0],
  ["This week", 7],
  ["This month", 30],
  ["No date", -1],
] as const;

function CheckCircle({ done }: { done: boolean }) {
  const t = useTheme();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (done) s.value = withSequence(withTiming(1.08, SMOOTH), withTiming(1, SMOOTH));
  }, [done, s]);
  return (
    <Animated.View
      style={[
        {
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 1.5,
          alignItems: "center",
          justifyContent: "center",
          borderColor: done ? t.success : t.borderStrong,
          backgroundColor: done ? t.success : "transparent",
        },
        a,
      ]}
    >
      {done ? (
        <Animated.View entering={ZoomIn.duration(280)}>
          <Check size={14} color={t.overlay.onImageFg} strokeWidth={3} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export default function Checklist() {
  const t = useTheme();
  const toast = useToast();
  const sheet = useRef<SheetRef>(null);
  const { data, setData, error, loading, refreshing, refresh, reload } = useQuery(() =>
    api.wedding().then((w) => w.tasks ?? []),
  );
  const [filter, setFilter] = useState<Filter>("open");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<string | undefined>();
  const [due, setDue] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [burst, setBurst] = useState(0);

  const tasks = data ?? [];
  const done = tasks.filter((x) => x.status === "DONE").length;
  const pct = tasks.length ? done / tasks.length : 0;

  const groups = useMemo(() => {
    const shown = tasks.filter((x) =>
      filter === "all" ? true : filter === "done" ? x.status === "DONE" : x.status !== "DONE",
    );
    const map = new Map<string, Task[]>();
    for (const task of shown) {
      const key = task.category ? titleCase(task.category) : "General";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return [...map.entries()];
  }, [tasks, filter]);

  async function toggle(task: Task) {
    const status: Task["status"] = task.status === "DONE" ? "TODO" : "DONE";
    const prev = tasks;
    const next = tasks.map((x) => (x.id === task.id ? { ...x, status } : x));
    status === "DONE" ? success() : tap();
    setData(next);
    if (status === "DONE" && next.every((x) => x.status === "DONE")) setBurst(Date.now());
    await api.setTaskStatus(task.id, status).catch(() => {
      setData(prev);
      toast("Couldn't save", "error");
    });
  }

  async function remove(task: Task) {
    const prev = tasks;
    setData(tasks.filter((x) => x.id !== task.id));
    toast("Task deleted", "info");
    await api.deleteTask(task.id).catch(() => {
      setData(prev);
      toast("Couldn't delete", "error");
    });
  }

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const created = await api.createTask({
        title: title.trim(),
        category: cat,
        dueAt: due >= 0 ? addDays(due) : null,
      });
      success();
      setData([created, ...tasks]);
      setTitle("");
      setCat(undefined);
      setDue(-1);
      sheet.current?.dismiss();
      toast("Task added");
    } catch {
      toast("Couldn't add task", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <ScreenSkeleton />;

  return (
    <View style={{ flex: 1 }}>
      <Confetti fire={burst} />
      <Screen
        eyebrow="Planning"
        title="Checklist"
        bottomSpace={TAB_BAR_SPACE + 40}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />}
      >
        {error ? <ErrorNote message={error} onRetry={reload} /> : null}

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <Ring value={pct} size={88} stroke={8} color={t.success}>
            <Text style={{ fontFamily: font.display, fontSize: 26, color: t.heading }}>{Math.round(pct * 100)}%</Text>
          </Ring>
          <View style={{ flex: 1, gap: 4 }}>
            <Eyebrow size={10}>
              {done} of {tasks.length} complete
            </Eyebrow>
            <Display size={22}>
              {pct >= 1
                ? "Everything's done ✦"
                : pct > 0.6
                  ? "Nearly there"
                  : pct > 0.25
                    ? "Great momentum"
                    : "Let's begin"}
            </Display>
            <Body muted size={13}>
              {tasks.length - done} tasks left
            </Body>
          </View>
        </Card>

        <View style={{ marginTop: 18 }}>
          <Tabs
            value={filter}
            onChange={setFilter}
            fill
            items={[
              { id: "open", label: "To do", badge: tasks.filter((x) => x.status !== "DONE").length || undefined },
              { id: "done", label: "Done", badge: done || undefined },
              { id: "all", label: "All" },
            ]}
          />
        </View>

        {groups.length === 0 ? (
          <Animated.View entering={FadeIn}>
            <EmptyState
              icon={<Sparkles size={24} color={t.primaryText} />}
              title={filter === "done" ? "Nothing ticked yet" : "All caught up"}
              body={filter === "done" ? "Completed tasks will gather here." : "Tap + whenever something new comes up."}
            />
          </Animated.View>
        ) : null}

        {groups.map(([category, items]) => (
          <Animated.View
            key={category}
            layout={LinearTransition.duration(280)}
            entering={FadeIn}
            exiting={FadeOut}
            style={{ marginTop: 22 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              <Display size={21}>{category}</Display>
              <Body muted size={12}>
                {items.length}
              </Body>
            </View>
            <Card padded={false} style={{ overflow: "hidden" }}>
              {items.map((task, i) => {
                const isDone = task.status === "DONE";
                const overdue = !isDone && task.dueAt && new Date(task.dueAt) < new Date();
                return (
                  <Animated.View
                    key={task.id}
                    layout={LinearTransition.duration(280)}
                    entering={FadeIn.duration(250)}
                    exiting={FadeOut.duration(180)}
                  >
                    <SwipeRow
                      left={{
                        label: isDone ? "Undo" : "Done",
                        icon: <Check size={22} color={t.overlay.onImageFg} />,
                        color: isDone ? t.muted : t.success,
                        onAction: () => toggle(task),
                      }}
                      right={{
                        label: "Delete",
                        icon: <Trash2 size={20} color={t.overlay.onImageFg} />,
                        color: t.danger,
                        onAction: () => remove(task),
                      }}
                    >
                      <Pressable
                        onPress={() => toggle(task)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isDone }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                          paddingHorizontal: 16,
                          paddingVertical: 15,
                          backgroundColor: t.card,
                          borderTopWidth: i ? 1 : 0,
                          borderTopColor: t.border,
                        }}
                      >
                        <CheckCircle done={isDone} />
                        <View style={{ flex: 1 }}>
                          <Body
                            medium={!isDone}
                            style={{
                              color: isDone ? t.muted : t.heading,
                              textDecorationLine: isDone ? "line-through" : "none",
                            }}
                          >
                            {task.title}
                          </Body>
                          {task.dueAt ? (
                            <Body size={12} style={{ color: overdue ? t.danger : t.muted }}>
                              {overdue ? "Overdue · " : "Due "}
                              {formatDate(task.dueAt)}
                            </Body>
                          ) : null}
                        </View>
                      </Pressable>
                    </SwipeRow>
                  </Animated.View>
                );
              })}
            </Card>
          </Animated.View>
        ))}
        {groups.length ? (
          <Body muted size={12} style={{ textAlign: "center", marginTop: 14 }}>
            Swipe right to complete · left to delete
          </Body>
        ) : null}
      </Screen>

      {/* Floating add button */}
      <Animated.View
        entering={ZoomIn.delay(300).duration(280)}
        style={[{ position: "absolute", right: 22, bottom: TAB_BAR_SPACE + 6 }, shadow.raised]}
      >
        <Pressable
          onPress={() => {
            impact();
            sheet.current?.present();
          }}
          accessibilityLabel="Add task"
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: t.primary,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 0.92 : 1 }],
          })}
        >
          <Plus size={26} color={t.primaryFg} />
        </Pressable>
      </Animated.View>

      <Sheet ref={sheet} eyebrow="Checklist" title="New task">
        <SheetField
          placeholder="What needs doing?"
          value={title}
          onChangeText={setTitle}
          autoFocus
          style={{ fontSize: 17 }}
        />
        <View style={{ marginTop: 16 }}>
          <Select
            label="Category"
            optional
            placeholder="Any category"
            value={cat ?? ""}
            onChange={(v) => setCat(v || undefined)}
            options={[{ value: "", label: "Any category" }, ...CATS.map((c) => ({ value: c, label: titleCase(c) }))]}
          />
        </View>
        <View style={{ marginTop: 16 }}>
          <Select
            label="Due"
            value={String(due)}
            onChange={(v) => setDue(Number(v))}
            options={DUE.map(([label, n]) => ({ value: String(n), label }))}
          />
        </View>
        <View style={{ marginTop: 26 }}>
          <Button
            label="Add task"
            onPress={add}
            loading={saving}
            disabled={!title.trim()}
            icon={<Plus size={18} color={t.primaryFg} />}
          />
        </View>
      </Sheet>
    </View>
  );
}
