"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Link2, Palette, Plus, Share2, Trash2 } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Moodboard, MoodboardSummary } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { cn } from "@ceylonweddings/ui/utils";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import { MoodboardStudio } from "../../../../components/moodboard/studio";
import type { AutosaveStatus } from "../../../../components/moodboard/use-autosave";

export default function MoodboardPage() {
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
    if (!window.confirm(`Delete “${board.title}”?`)) return;
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

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-[42rem] flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-[#1f1a16] sm:text-3xl">
            {t("nav.moodboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pin photos, notes, and video — fullscreen when you need room to work.
          </p>
        </div>
        <p
          className={cn(
            "text-xs",
            status === "error" || status === "conflict" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {statusLabel}
        </p>
      </header>

      {!board ? (
        <EmptyState
          icon={Palette}
          title="No moodboard yet"
          description="Create a board to start designing."
        />
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
            headerExtra={
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <div
                  role="tablist"
                  className="flex max-w-full items-center gap-1 overflow-x-auto"
                >
                  {summaries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs transition",
                        item.id === selectedId
                          ? "bg-[#fffaf5] text-[#1f1a16]"
                          : "text-[#fffaf5]/70 hover:bg-white/10",
                      )}
                    >
                      {item.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void createBoard()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[#fffaf5]/70 hover:bg-white/10"
                  >
                    <Plus className="size-3.5" />
                    New
                  </button>
                </div>
                <Input
                  aria-label="Board title"
                  defaultValue={board.title}
                  key={`title-${board.id}-${board.title}`}
                  className="h-8 w-32 border-white/15 bg-white/5 text-[#fffaf5] sm:w-40"
                  onBlur={(e) => {
                    const next = e.target.value.trim();
                    if (next && next !== board.title) void renameBoard(next);
                  }}
                />
                <SimpleSelect
                  value={board.eventId ?? "__none__"}
                  onValueChange={(value) => void linkEvent(value === "__none__" ? "" : value)}
                  options={eventOptions}
                  className="h-8 w-32 border-white/15 bg-white/5 text-sm text-[#fffaf5] sm:w-36"
                  aria-label="Link event"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  disabled={busy}
                  onClick={() => void toggleShare(!board.shareEnabled)}
                >
                  <Share2 className="mr-1 size-3.5" />
                  {board.shareEnabled ? "Shared" : "Share"}
                </Button>
                {shareUrl ? (
                  <Button type="button" size="sm" variant="ghost" className="h-8 text-[#fffaf5]" onClick={() => void copyShareLink()}>
                    {copied ? <Check className="mr-1 size-3.5" /> : <Copy className="mr-1 size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                ) : null}
                {summaries.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-red-300"
                    disabled={busy}
                    onClick={() => void deleteBoard()}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>
      )}

      {shareUrl ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" />
          <a className="truncate underline underline-offset-2" href={shareUrl} target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}
