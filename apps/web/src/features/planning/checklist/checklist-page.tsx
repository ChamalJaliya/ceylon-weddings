"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock, CalendarDays, Check, ListChecks, Plus, Sparkles, Trash2, User } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Task } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { AnimatePresence, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";

const COLOMBO = "Asia/Colombo";

function scheduleWindowFromDue(dueAt: string | null): { startsAt: string; endsAt: string } {
  const base = dueAt ? new Date(dueAt) : new Date();
  const day = base.toLocaleDateString("en-CA", { timeZone: COLOMBO });
  const startsAt = new Date(`${day}T10:00:00+05:30`).toISOString();
  const endsAt = new Date(`${day}T11:00:00+05:30`).toISOString();
  return { startsAt, endsAt };
}

const NEXT_STATUS: Record<Task["status"], Task["status"]> = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };
const STATUS_LABEL: Record<Task["status"], string> = { TODO: "To do", DOING: "In progress", DONE: "Done" };
const STATUS_STYLE: Record<Task["status"], string> = {
  TODO: "border-border bg-background text-muted-foreground",
  DOING: "border-warning/40 bg-warning/10 text-warning",
  DONE: "border-primary/30 bg-primary/10 text-primary",
};

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  tradition: { label: "Tradition & rituals", emoji: "🪔" },
  beauty: { label: "Beauty & attire", emoji: "💄" },
  photo: { label: "Photo & video", emoji: "📷" },
  venue: { label: "Venue", emoji: "🏛️" },
  legal: { label: "Legal & registration", emoji: "📜" },
  guests: { label: "Guests & invites", emoji: "💌" },
  catering: { label: "Food & catering", emoji: "🍰" },
  general: { label: "General", emoji: "✨" },
  homecoming: { label: "Homecoming", emoji: "🏡" },
  travel: { label: "Travel", emoji: "✈️" },
  entertainment: { label: "Entertainment", emoji: "🥁" },
  music: { label: "Music", emoji: "🎶" },
  decor: { label: "Decor & flowers", emoji: "💐" },
  transport: { label: "Transport", emoji: "🚗" },
  schedule: { label: "Schedule prep", emoji: "🗓️" },
};
const categoryMeta = (key: string) =>
  CATEGORY_META[key] ?? { label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " "), emoji: "📌" };

const SEED = [
  { title: "Confirm auspicious Nekath with Astrologer", category: "tradition" },
  { title: "Book Poruwa & traditional Ashtaka", category: "tradition" },
  { title: "Book bridal dresser & Mul Anduma stylist", category: "beauty" },
  { title: "Book wedding photographer & videographer", category: "photo" },
  { title: "Reserve venue & banquet hall", category: "venue" },
  { title: "Submit 14-day Notice of Marriage to Registrar", category: "legal" },
  { title: "Jayamangala Gatha choir rehearsal", category: "tradition" },
  { title: "Finalize guest households & WhatsApp e-invites", category: "guests" },
  { title: "Order wedding cake & traditional sweetmeats (Kevum/Kokis)", category: "catering" },
];

type Filter = "ALL" | Task["status"];

function dueInfo(dueAt: string | null, status: Task["status"]) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  const label = due.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const overdue = status !== "DONE" && days < 0;
  const soon = status !== "DONE" && days >= 0 && days <= 7;
  return { label, overdue, soon };
}

export default function ChecklistPage() {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const highlightTaskId = searchParams.get("taskId");
  const { data, error, reload } = useWedding();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const counts = useMemo(
    () => ({
      ALL: tasks.length,
      TODO: tasks.filter((x) => x.status === "TODO").length,
      DOING: tasks.filter((x) => x.status === "DOING").length,
      DONE: tasks.filter((x) => x.status === "DONE").length,
    }),
    [tasks],
  );
  const allCategories = useMemo(() => [...new Set(tasks.map((x) => x.category ?? "general"))], [tasks]);

  useEffect(() => {
    if (!highlightTaskId) return;
    const el = document.getElementById(`task-${highlightTaskId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightTaskId, tasks.length]);

  if (!data) return <SignInPrompt error={error} />;

  const canEdit = data.myAccess.role === "COUPLE" || data.myAccess.canEditGuests;
  const members = Object.fromEntries((data.members ?? []).map((m) => [m.userId, m.name]));
  const pct = tasks.length ? Math.round((counts.DONE / tasks.length) * 100) : 0;
  const daysToGo = data.date ? Math.ceil((new Date(data.date).getTime() - Date.now()) / 86_400_000) : null;
  const overdueCount = tasks.filter((x) => dueInfo(x.dueAt, x.status)?.overdue).length;

  const visible = tasks.filter(
    (x) => (filter === "ALL" || x.status === filter) && (!activeCat || (x.category ?? "general") === activeCat),
  );
  const groups = visible.reduce<Record<string, Task[]>>((acc, task) => {
    (acc[task.category ?? "general"] ??= []).push(task);
    return acc;
  }, {});
  const order: Record<Task["status"], number> = { DOING: 0, TODO: 1, DONE: 2 };
  for (const g of Object.values(groups)) g.sort((a, b) => order[a.status] - order[b.status]);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try {
      await fn();
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await run("create", () =>
      api.wedding.createTask({
        title: title.trim(),
        category: category.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        status: "TODO",
      }),
    );
    setTitle("");
    setDueAt("");
  }

  const seed = () =>
    run("seed", async () => {
      for (const item of SEED) await api.wedding.createTask({ ...item, status: "TODO" });
    });

  async function scheduleTask(task: Task) {
    const window = scheduleWindowFromDue(task.dueAt);
    await run(task.id, async () => {
      const appointment = await api.wedding.createAppointment({
        title: task.title,
        kind: "OTHER",
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        reminderMinutes: 30,
        notes: task.category ? `From checklist · ${task.category}` : "From checklist",
      });
      await api.wedding.updateTask(task.id, { appointmentId: appointment.id });
      toast.success(t("knotly.taskScheduled"));
    });
  }

  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="cw-stack">
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden rounded-3xl p-6 text-paper shadow-raised sm:p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 0%, transparent 60%)," +
            "radial-gradient(60% 70% at 100% 120%, color-mix(in srgb, var(--cw-gold-300) 18%, transparent) 0%, transparent 60%)," +
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 35%, var(--color-ink)) 0%, var(--color-ink) 70%)",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="grid gap-4">
            <p className="flex items-center gap-2 text-label tracking-eyebrow text-paper/60 uppercase">
              <ListChecks className="size-3.5" /> {t("hub.kicker")}
            </p>
            <h1 className="font-serif text-4xl leading-none font-medium tracking-tight sm:text-5xl">
              {t("nav.checklist")}
            </h1>
            <p className="max-w-md text-paper/70">{t("marketing.checklistHelp")}</p>
            <div className="flex flex-wrap gap-2 pt-1 text-sm">
              {daysToGo !== null && daysToGo >= 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5">
                  <CalendarClock className="size-3.5" /> {daysToGo} days to go
                </span>
              ) : null}
              <span className="rounded-full bg-paper/10 px-3 py-1.5">{counts.TODO} to do</span>
              <span className="rounded-full bg-paper/10 px-3 py-1.5">{counts.DOING} in progress</span>
              {overdueCount ? (
                <span className="rounded-full bg-love px-3 py-1.5 text-love-foreground">{overdueCount} overdue</span>
              ) : null}
            </div>
          </div>
          <div className="relative mx-auto grid size-36 place-items-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={8} />
              <motion.circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="var(--cw-gold-300)"
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={C}
                initial={reduce ? false : { strokeDashoffset: C }}
                animate={{ strokeDashoffset: C - (pct / 100) * C }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="text-center">
              <p className="font-serif text-4xl leading-none">{pct}%</p>
              <p className="mt-1 text-xs text-paper/60">
                {counts.DONE} of {tasks.length} done
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick add */}
      {canEdit ? (
        <form
          onSubmit={addTask}
          className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-card sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2 pl-3">
            <Plus className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("planning.taskTitle")}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              required
            />
          </div>
          <Combobox
            value={category}
            onValueChange={setCategory}
            placeholder={t("planning.category")}
            searchPlaceholder="Search or add category…"
            allowCustom
            formatCustom={(q) => q.toLowerCase().replace(/\s+/g, "_")}
            className="sm:w-48"
            options={[...new Set([...Object.keys(CATEGORY_META), ...allCategories])].map((c) => ({
              value: c,
              label: `${categoryMeta(c).emoji} ${categoryMeta(c).label}`,
            }))}
          />
          <div className="sm:w-44">
            <DatePicker value={dueAt} onChange={(v) => setDueAt(v ?? "")} />
          </div>
          <Button type="submit" shape="pill" disabled={busy === "create"}>
            {t("planning.addTask")}
          </Button>
        </form>
      ) : null}

      {/* Filters */}
      {tasks.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {(["ALL", "TODO", "DOING", "DONE"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "ALL" ? "All" : STATUS_LABEL[f]}
                <span className="ml-1.5 opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCat(activeCat === c ? null : c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  activeCat === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {categoryMeta(c).emoji} {categoryMeta(c).label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Groups */}
      {tasks.length === 0 ? (
        <div className="grid place-items-center gap-4 rounded-3xl border border-dashed border-border p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="size-6" />
          </span>
          <div>
            <p className="font-serif text-2xl">Start your checklist</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first task above, or start from a Sri Lankan tradition template — Nekath, Poruwa, registrar
              notice and more.
            </p>
          </div>
          {canEdit ? (
            <Button shape="pill" className="gap-2" disabled={busy === "seed"} onClick={seed}>
              <Sparkles className="size-4" /> {busy === "seed" ? "Adding…" : "Use tradition template"}
            </Button>
          ) : null}
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing here — try another filter.
        </p>
      ) : (
        <div className="gap-4 lg:columns-2 [&>section]:mb-4">
          {Object.entries(groups).map(([group, groupTasks]) => {
            const meta = categoryMeta(group);
            const all = tasks.filter((x) => (x.category ?? "general") === group);
            const groupDone = all.filter((x) => x.status === "DONE").length;
            return (
              <section
                key={group}
                className="break-inside-avoid overflow-hidden rounded-3xl border border-border bg-card shadow-card"
              >
                <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-lg">{meta.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{meta.label}</p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(groupDone / all.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {groupDone}/{all.length}
                  </span>
                </header>
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {groupTasks.map((task) => {
                      const due = dueInfo(task.dueAt, task.status);
                      const done = task.status === "DONE";
                      return (
                        <motion.li
                          id={`task-${task.id}`}
                          key={task.id}
                          layout={!reduce}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={cn(
                            "group flex items-center gap-3 px-5 py-3",
                            busy === task.id && "opacity-60",
                            highlightTaskId === task.id && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                          )}
                        >
                          <button
                            type="button"
                            aria-label={done ? "Mark as not done" : "Mark as done"}
                            disabled={busy === task.id || !canEdit}
                            onClick={() =>
                              run(task.id, () => api.wedding.updateTask(task.id, { status: done ? "TODO" : "DONE" }))
                            }
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary",
                            )}
                          >
                            {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm", done && "text-muted-foreground line-through")}>{task.title}</p>
                            {due || task.assigneeUserId || task.appointmentId ? (
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                                {due ? (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1",
                                      due.overdue && "text-destructive",
                                      due.soon && "text-warning",
                                    )}
                                  >
                                    <CalendarClock className="size-3" /> {due.overdue ? "Overdue · " : ""}
                                    {due.label}
                                  </span>
                                ) : null}
                                {task.assigneeUserId ? (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="size-3" />
                                    {members[task.assigneeUserId] ?? t("planning.assignee")}
                                  </span>
                                ) : null}
                                {task.appointmentId ? (
                                  <Link
                                    href={`/planning/calendar?highlight=${task.appointmentId}`}
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <CalendarDays className="size-3" />
                                    {t("knotly.viewOnCalendar")}
                                  </Link>
                                ) : null}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={busy === task.id || !canEdit}
                            onClick={() =>
                              run(task.id, () => api.wedding.updateTask(task.id, { status: NEXT_STATUS[task.status] }))
                            }
                            title="Click to change status"
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/50",
                              STATUS_STYLE[task.status],
                            )}
                          >
                            {STATUS_LABEL[task.status]}
                          </button>
                          {canEdit && !task.appointmentId ? (
                            <button
                              type="button"
                              aria-label={t("knotly.scheduleOnCalendar")}
                              title={t("knotly.scheduleOnCalendar")}
                              disabled={busy === task.id}
                              onClick={() => void scheduleTask(task)}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <CalendarDays className="size-4" />
                            </button>
                          ) : null}
                          {canEdit ? (
                            <button
                              type="button"
                              aria-label="Remove task"
                              disabled={busy === task.id}
                              onClick={() => run(task.id, () => api.wedding.deleteTask(task.id))}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          ) : null}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
