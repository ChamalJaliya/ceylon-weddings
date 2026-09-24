"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Music2 } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { MusicBrief } from "@ceylonweddings/contracts";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { Button } from "@ceylonweddings/ui/components/button";

export default function MusicBriefPage() {
  const params = useParams<{ token: string; locale: string }>();
  const token = params.token;
  const [brief, setBrief] = useState<MusicBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.public
      .musicBrief(token)
      .then((data) => {
        setBrief(data);
        setError(null);
      })
      .catch((err) => {
        setBrief(null);
        setError(err instanceof Error ? err.message : "Brief not found");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading music brief…</div>;
  }

  if (error || !brief) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={Music2} title="Brief unavailable" description={error ?? "This share link is off or invalid."} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 print:py-4">
      <header className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ceylon Weddings · Music brief</p>
        <h1 className="font-display text-4xl">{brief.eventName}</h1>
        <p className="text-muted-foreground">
          {brief.eventKind}
          {brief.eventStartsAt ? ` · ${new Date(brief.eventStartsAt).toLocaleString()}` : ""}
          {brief.venueName ? ` · ${brief.venueName}` : ""}
        </p>
        {brief.vibePrimary ? <p className="text-sm">Vibe: {brief.vibePrimary}</p> : null}
        {brief.languages.length ? <p className="text-sm">Languages: {brief.languages.join(", ")}</p> : null}
        {brief.notes ? <p className="text-sm whitespace-pre-wrap">{brief.notes}</p> : null}
        <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
          Print / save PDF
        </Button>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Cue timeline</h2>
        {brief.cues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cues yet.</p>
        ) : (
          <ol className="space-y-3">
            {brief.cues.map((cue, index) => (
              <li key={`${cue.label}-${index}`} className="rounded-lg border border-border/50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{cue.kind}</p>
                <p className="font-medium">{cue.label}</p>
                {cue.trackTitle ? <p className="text-sm">{cue.trackTitle}</p> : null}
                <p className="text-sm text-muted-foreground">
                  {cue.startsAt
                    ? new Date(cue.startsAt).toLocaleString()
                    : cue.offsetMinutes != null
                      ? `${cue.offsetMinutes} min from start`
                      : "Time TBD"}
                  {cue.durationMinutes != null ? ` · ${cue.durationMinutes} min` : ""}
                </p>
                {cue.notes ? <p className="mt-1 text-sm whitespace-pre-wrap">{cue.notes}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {(
        [
          ["Must play", brief.mustPlay],
          ["Maybe", brief.maybePlay],
          ["Do not play", brief.doNotPlay],
        ] as const
      ).map(([title, tracks]) => (
        <section key={title} className="space-y-3">
          <h2 className="text-xl font-medium">{title}</h2>
          {tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">None listed.</p>
          ) : (
            <ul className="space-y-2">
              {tracks.map((track, index) => (
                <li key={`${track.title}-${index}`} className="text-sm">
                  <span className="font-medium">{track.title}</span>
                  {track.artist ? ` — ${track.artist}` : ""}
                  {track.url ? (
                    <>
                      {" · "}
                      <a className="underline" href={track.url} target="_blank" rel="noreferrer">
                        link
                      </a>
                    </>
                  ) : null}
                  {track.notes ? <p className="text-muted-foreground">{track.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
