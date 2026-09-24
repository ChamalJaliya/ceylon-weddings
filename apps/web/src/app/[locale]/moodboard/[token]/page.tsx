"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Palette } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Moodboard, MoodboardBrief } from "@ceylonweddings/contracts";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { MoodboardStudio } from "../../../../components/moodboard/studio";

export default function PublicMoodboardPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [brief, setBrief] = useState<MoodboardBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.public
      .moodboard(token)
      .then((data) => {
        setBrief(data);
        setError(null);
      })
      .catch((err) => {
        setBrief(null);
        setError(err instanceof Error ? err.message : "Board not found");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">Loading moodboard…</div>;
  }

  if (error || !brief) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Palette}
          title="Moodboard unavailable"
          description={error ?? "This share link is off or invalid."}
        />
      </div>
    );
  }

  const board: Moodboard = {
    id: "public",
    weddingId: "public",
    title: brief.title,
    eventId: null,
    eventName: brief.eventName,
    notes: brief.notes,
    scene: brief.scene,
    version: 1,
    shareEnabled: true,
    sortOrder: 0,
    assets: brief.assets.map((a, index) => ({
      id: `asset-${index}`,
      moodboardId: "public",
      fileId: a.fileId,
      key: a.fileId,
      publicUrl: a.publicUrl,
      mimeType: a.mimeType,
    })),
    migratedFromSketch: brief.migratedFromSketch,
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-6xl flex-col gap-3 px-3 py-4 sm:px-6">
      <header className="shrink-0 space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Ceylon Weddings · Moodboard
        </p>
        <h1 className="font-display text-3xl sm:text-4xl">{brief.title}</h1>
        <p className="text-sm text-muted-foreground">
          {[brief.coupleLabel, brief.eventName].filter(Boolean).join(" · ")}
        </p>
        {brief.notes ? <p className="text-sm whitespace-pre-wrap">{brief.notes}</p> : null}
      </header>
      <div className="min-h-0 flex-1">
        <MoodboardStudio board={board} mode="view" />
      </div>
    </div>
  );
}
