"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Palette, Plus, Share2, Trash2 } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Moodboard, MoodboardSummary } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { cn } from "@ceylonweddings/ui/utils";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { heroButtonClass, heroSelectClass } from "@/features/planning/components/planning-hero";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { MoodboardStudio } from "@/components/moodboard/studio";
import type { AutosaveStatus } from "@/components/moodboard/use-autosave";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";

export default function MoodboardPage() {
  const confirm = useConfirm();
  const t = useTranslations();
  const locale = useLocale();
  const { data, error } = useWedding();
  const [summaries, setSummaries] = useState<MoodboardSummary[]>([]);
  const [board, setBoard] = useState<Moodboard | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    let list = await api.wedding.moodboards();
    if (list.length === 0) {
      const created = await api.wedding.createMoodboard({ title: "Style" });
      list = [
        {
          id: created.id,
          weddingId: created.weddingId,
          title: created.title,
          eventId: created.eventId,
          eventName: created.eventName ?? null,
          notes: created.notes,
          version: created.version,
          shareToken: created.shareToken ?? null,
          shareEnabled: created.shareEnabled,
          sortOrder: created.sortOrder,
          elementCount: created.elementCount ?? 0,
          assetCount: created.assets.length,
          ready: created.ready ?? false,
          updatedAt: created.updatedAt,
          createdAt: created.createdAt,
        },
      ];
      setBoard(created);
      setSelectedId(created.id);
    }
    setSummaries(list);
    return list;
  }, []);

  useEffect(() => {
    loadList()
      .then((list) => {
        if (list[0] && !selectedId) setSelectedId(list[0].id);
      })
      .catch(() => setSummaries([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    api.wedding
      .moodboard(selectedId)
      .then((full) => {
        if (!cancelled) {
          setBoard(full);
          setShareUrl(
            full.shareEnabled && full.shareToken
              ? `${window.location.origin}/${locale}/moodboard/${full.shareToken}`
              : null,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setBoard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, locale]);

  const eventOptions = useMemo(
    () => [
      { value: "__none__", label: "Any event" },
      ...(data?.events ?? []).map((event) => ({ value: event.id, label: event.name })),
    ],
    [data?.events],
  );

  const statusLabel = useMemo(() => {
    switch (status) {
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved";
      case "conflict":
        return statusMessage ?? "Conflict — reload";
      case "error":
        return statusMessage ?? "Save failed";
      default:
        return "Autosave";
    }
  }, [status, statusMessage]);

  if (error) return <SignInPrompt error={error} />;

  async function createBoard() {
    setBusy(true);
    try {
      const created = await api.wedding.createMoodboard({
        title: `Board ${summaries.length + 1}`,
      });
      await loadList();
      setSelectedId(created.id);
      setBoard(created);
    } finally {
      setBusy(false);
    }
  }

  async function renameBoard(title: string) {
    if (!board) return;
    const updated = await api.wedding.updateMoodboard(board.id, { title });
    setBoard(updated);
    await loadList();
  }

  async function linkEvent(eventId: string) {
    if (!board) return;
    const updated = await api.wedding.updateMoodboard(board.id, {
      eventId: eventId || null,
    });
    setBoard(updated);
    await loadList();
  }

  async function deleteBoard() {
    if (!board || summaries.length <= 1) return;
    if (!(await confirm({ title: `Delete “${board.title}”?`, destructive: true }))) return;
    setBusy(true);
    try {
      await api.wedding.deleteMoodboard(board.id);
      const list = await loadList();
      setSelectedId(list[0]?.id ?? "");
      setBoard(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleShare(enabled: boolean) {
    if (!board) return;
    setBusy(true);
    try {
      const updated = await api.wedding.setMoodboardShare(board.id, { enabled, rotate: enabled });
      setBoard(updated);
      setShareUrl(
        updated.shareEnabled && updated.shareToken
          ? `${window.location.origin}/${locale}/moodboard/${updated.shareToken}`
          : null,
      );
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const counts = summaries.find((s) => s.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-[42rem] flex-col gap-3">
      <section
        className="relative isolate shrink-0 overflow-hidden rounded-3xl px-5 py-4 text-paper shadow-raised sm:px-6"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 0%, transparent 60%)," +
            "radial-gradient(60% 120% at 100% 120%, color-mix(in srgb, var(--cw-gold-300) 18%, transparent) 0%, transparent 60%)," +
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 35%, var(--color-ink)) 0%, var(--color-ink) 70%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-paper/10">
              <Palette className="size-5" />
            </span>
            <div>
              <h1 className="font-serif text-2xl leading-none sm:text-3xl">{t("nav.moodboard")}</h1>
              <p className="mt-1 flex items-center gap-2 text-xs text-paper/60">
                {counts ? (
                  <span>
                    {counts.elementCount} items · {counts.assetCount} uploads
                  </span>
                ) : null}
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    (status === "error" || status === "conflict") && "text-love",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      status === "saving"
                        ? "animate-pulse bg-[color:var(--cw-gold-300)]"
                        : status === "error" || status === "conflict"
                          ? "bg-love"
                          : "bg-paper/50",
                    )}
                  />
                  {statusLabel}
                </span>
              </p>
            </div>
          </div>

          {board ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Board title"
                defaultValue={board.title}
                key={`title-${board.id}-${board.title}`}
                className="h-9 w-40 border-paper/20 bg-paper/10 text-paper placeholder:text-paper/50"
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== board.title) void renameBoard(next);
                }}
              />
              <Combobox
                aria-label="Link event"
                value={board.eventId ?? "__none__"}
                onValueChange={(value) => void linkEvent(value === "__none__" ? "" : value)}
                options={eventOptions}
                searchPlaceholder="Search events…"
                className={cn("h-9 w-40", heroSelectClass)}
              />
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className={cn(heroButtonClass, board.shareEnabled && "border-[color:var(--cw-gold-300)]/60")}
                disabled={busy}
                onClick={() => void toggleShare(!board.shareEnabled)}
              >
                <Share2 className="size-3.5" />
                {board.shareEnabled ? "Shared" : "Share"}
              </Button>
              {shareUrl ? (
                <Button
                  type="button"
                  size="sm"
                  shape="pill"
                  variant="outline"
                  className={heroButtonClass}
                  onClick={() => void copyShareLink()}
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              ) : null}
              {summaries.length > 1 ? (
                <button
                  type="button"
                  aria-label="Delete board"
                  disabled={busy}
                  onClick={() => void deleteBoard()}
                  className="grid size-9 place-items-center rounded-full text-paper/60 transition hover:bg-love/20 hover:text-love"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Board tabs */}
        <div className="mt-4 -mb-1 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {summaries.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition",
                item.id === selectedId ? "bg-paper text-ink" : "text-paper/70 hover:bg-paper/10 hover:text-paper",
              )}
            >
              {item.title}
              {item.eventName ? <span className="ml-1.5 opacity-60">· {item.eventName}</span> : null}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void createBoard()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-paper/30 px-3 py-1.5 text-sm text-paper/70 transition hover:border-paper/60 hover:text-paper"
          >
            <Plus className="size-3.5" /> New board
          </button>
        </div>
      </section>

      {!board ? (
        <div className="grid flex-1 place-items-center rounded-3xl border border-dashed border-border text-center">
          <div className="grid place-items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Palette className="size-6" />
            </span>
            <p className="font-serif text-2xl">No moodboard yet</p>
            <p className="text-sm text-muted-foreground">Create a board to start designing.</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <MoodboardStudio
            board={board}
            onSaved={(saved) => {
              setBoard((prev) => (prev ? { ...prev, ...saved, assets: prev.assets } : saved));
              void loadList();
            }}
            onStatus={(next, message) => {
              setStatus(next);
              setStatusMessage(message ?? null);
            }}
          />
        </div>
      )}
    </div>
  );
}
