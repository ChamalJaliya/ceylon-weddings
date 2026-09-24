"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Task } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { FieldBlock, FormGrid, FormPanel } from "@ceylonweddings/ui/domain/creator-form";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";

const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  TODO: "DOING",
  DOING: "DONE",
  DONE: "TODO",
};

export default function ChecklistPage() {
  const t = useTranslations();
  const { data, error, reload } = useWedding();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  if (!data) return <SignInPrompt error={error} />;

  const members = Object.fromEntries((data.members ?? []).map((member) => [member.userId, member.name]));
  const tasks = data.tasks ?? [];
  const done = tasks.filter((task) => task.status === "DONE").length;
  const byCategory = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.category ?? "general";
    (acc[key] ??= []).push(task);
    return acc;
  }, {});

  async function cycle(task: Task) {
    setBusy(task.id);
    try {
      await api.wedding.updateTask(task.id, { status: NEXT_STATUS[task.status] });
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function markDone(task: Task) {
    setBusy(task.id);
    try {
      await api.wedding.updateTask(task.id, { status: "DONE" });
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function removeTask(id: string) {
    setBusy(id);
    try {
      await api.wedding.deleteTask(id);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    setBusy("create");
    try {
      await api.wedding.createTask({ title, category: category || undefined, status: "TODO" });
      setTitle("");
      setCategory("");
      await reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="cw-stack">
      <PageHeader
        icon={ListChecks}
        kicker={t("hub.kicker")}
        title={t("nav.checklist")}
        description={t("marketing.checklistHelp")}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-3xl border border-border/70 bg-card/40 p-5 flex-1 min-w-[280px]">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Progress</p>
          <p className="mt-1 font-serif text-3xl">
            {done}
            <span className="text-lg text-muted-foreground"> / {tasks.length}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%` }}
            />
          </div>
        </div>
        {data.myAccess.role === "COUPLE" || data.myAccess.canEditGuests ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy === "seed"}
            onClick={async () => {
              setBusy("seed");
              try {
                const defaults = [
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
                for (const t of defaults) {
                  await api.wedding.createTask({ title: t.title, category: t.category, status: "TODO" });
                }
                await reload();
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "seed" ? "Seeding..." : "Seed Tradition Checklist (Poruwa/Church/Nikah)"}
          </Button>
        ) : null}
      </div>
      <form onSubmit={addTask}>
        <FormPanel>
          <FormGrid cols={4} className="items-end">
            <FieldBlock label={t("planning.taskTitle")} className="md:col-span-2" compact>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </FieldBlock>
            <FieldBlock label={t("planning.category")} compact>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </FieldBlock>
            <Button type="submit" disabled={busy === "create"}>
              {t("planning.addTask")}
            </Button>
          </FormGrid>
        </FormPanel>
      </form>
      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t("nav.checklist")} description={t("marketing.checklistHelp")} />
      ) : (
        Object.entries(byCategory).map(([group, groupTasks]) => (
          <SectionCard key={group} title={group} icon={ListChecks} variant="muted">
            <div className="divide-y divide-border/70">
              {groupTasks.map((task) => (
                <div
                  key={task.id}
                  className="cw-row-lift flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assigneeUserId ? members[task.assigneeUserId] ?? t("planning.assignee") : t("planning.category")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge intent={task.status === "DONE" ? "success" : task.status === "DOING" ? "warning" : "default"}>
                      {t(`planning.${task.status.toLowerCase()}`)}
                    </Badge>
                    <Button size="sm" variant="outline" disabled={busy === task.id} onClick={() => cycle(task)}>
                      {t("planning.cycleStatus")}
                    </Button>
                    {task.status !== "DONE" ? (
                      <Button size="sm" disabled={busy === task.id} onClick={() => markDone(task)}>
                        {t("planning.markDone")}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" disabled={busy === task.id} onClick={() => removeTask(task.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}
