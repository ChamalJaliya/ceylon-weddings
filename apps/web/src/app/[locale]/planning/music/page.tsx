"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Music2 } from "lucide-react";
import { useRouter } from "../../../../i18n/navigation";
import { api } from "@ceylonweddings/web";
import {
  musicTracksByList,
  orderedMusicCues,
  resolveCueStartsAt,
  type Appointment,
  type MusicCue,
  type MusicCueKind,
  type MusicListKind,
  type MusicPlan,
  type MusicTrack,
  type MusicVibe,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";

const LIST_LABELS: Record<MusicListKind, string> = {
  MUST: "Must play",
  MAYBE: "Maybe",
  DO_NOT: "Do not play",
};

const CUE_KINDS: MusicCueKind[] = [
  "PROCESSIONAL",
  "ENTRANCE",
  "CEREMONY",
  "RECESSIONAL",
  "COCKTAIL",
  "FIRST_DANCE",
  "PARENT_DANCE",
  "CAKE",
  "BOUQUET",
  "PARTY",
  "LAST_DANCE",
  "TRADITIONAL",
  "CUSTOM",
];

const VIBES: MusicVibe[] = [
  "TRADITIONAL",
  "ROMANTIC",
  "UPBEAT",
  "BAILA",
  "RELIGIOUS",
  "SOFT",
  "PARTY",
  "CUSTOM",
];

export default function MusicPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { data, error, reload } = useWedding();
  const [plans, setPlans] = useState<MusicPlan[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [eventId, setEventId] = useState("");
  const [plan, setPlan] = useState<MusicPlan | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [trackTitle, setTrackTitle] = useState("");
  const [trackArtist, setTrackArtist] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [trackList, setTrackList] = useState<MusicListKind>("MUST");

  const [cueLabel, setCueLabel] = useState("");
  const [cueKind, setCueKind] = useState<MusicCueKind>("CUSTOM");
  const [cueTrackTitle, setCueTrackTitle] = useState("");
  const [cueOffset, setCueOffset] = useState("0");
  const [cueAppointmentId, setCueAppointmentId] = useState<string>("");

  useEffect(() => {
    api.wedding.appointments().then(setAppointments).catch(() => setAppointments([]));
  }, []);

  useEffect(() => {
    if (data?.events?.length && !eventId) {
      setEventId(data.events[0]!.id);
    }
  }, [data, eventId]);

  useEffect(() => {
    api.wedding
      .musicPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (!eventId) {
      setPlan(null);
      return;
    }
    const existing = plans.find((p) => p.eventId === eventId) ?? null;
    setPlan(existing);
  }, [eventId, plans]);

  const event = useMemo(
    () => data?.events?.find((item) => item.id === eventId) ?? null,
    [data, eventId],
  );

  const agenda = useMemo(
    () => appointments.filter((a) => a.eventId === eventId),
    [appointments, eventId],
  );

  const entertainment = useMemo(
    () =>
      (data?.team ?? []).filter(
        (v) => v.category === "ENTERTAINMENT" && v.status === "BOOKED",
      ),
    [data?.team],
  );

  const tracksByList = useMemo(
    () => musicTracksByList((plan?.tracks ?? []) as MusicTrack[]),
    [plan?.tracks],
  );

  const cues = useMemo(() => {
    if (!event) return (plan?.cues ?? []) as MusicCue[];
    return orderedMusicCues((plan?.cues ?? []) as MusicCue[], event);
  }, [plan?.cues, event]);

  const briefUrl =
    plan?.shareEnabled && plan.shareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/music-brief/${plan.shareToken}`
      : null;

  async function refreshPlans() {
    const next = await api.wedding.musicPlans();
    setPlans(next);
    return next;
  }

  async function ensurePlan() {
    if (!eventId) return null;
    if (plan) return plan;
    setBusy(true);
    setStatus(null);
    try {
      const created = await api.wedding.upsertMusicPlan({ eventId });
      await refreshPlans();
      setPlan(created);
      return created;
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not create music plan");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onSeedTemplates(replace = false) {
    const current = await ensurePlan();
    if (!current) return;
    setBusy(true);
    setStatus(null);
    try {
      const next = await api.wedding.seedMusicCueTemplates(current.id, { replace });
      setPlan(next);
      await refreshPlans();
      setStatus(replace ? "Cues replaced from ceremony templates" : "Ceremony cues seeded");
      void reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not seed cues");
    } finally {
      setBusy(false);
    }
  }

  async function onAddTrack(eventForm: FormEvent) {
    eventForm.preventDefault();
    const current = await ensurePlan();
    if (!current || !trackTitle.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      await api.wedding.createMusicTrack(current.id, {
        list: trackList,
        title: trackTitle.trim(),
        artist: trackArtist.trim() || null,
        url: trackUrl.trim() || null,
      });
      setTrackTitle("");
      setTrackArtist("");
      setTrackUrl("");
      const next = await api.wedding.musicPlan(current.id);
      setPlan(next);
      await refreshPlans();
      void reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add track");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteTrack(trackId: string) {
    if (!plan) return;
    setBusy(true);
    try {
      await api.wedding.deleteMusicTrack(plan.id, trackId);
      const next = await api.wedding.musicPlan(plan.id);
      setPlan(next);
      await refreshPlans();
      void reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not delete track");
    } finally {
      setBusy(false);
    }
  }

  async function onAddCue(eventForm: FormEvent) {
    eventForm.preventDefault();
    const current = await ensurePlan();
    if (!current || !cueLabel.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const offset = Number.parseInt(cueOffset, 10);
      await api.wedding.createMusicCue(current.id, {
        kind: cueKind,
        label: cueLabel.trim(),
        trackTitle: cueTrackTitle.trim() || null,
        offsetMinutes: Number.isFinite(offset) ? offset : null,
        appointmentId: cueAppointmentId || null,
      });
      setCueLabel("");
      setCueTrackTitle("");
      setCueOffset("0");
      setCueAppointmentId("");
      const next = await api.wedding.musicPlan(current.id);
      setPlan(next);
      await refreshPlans();
      void reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add cue");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteCue(cueId: string) {
    if (!plan) return;
    setBusy(true);
    try {
      await api.wedding.deleteMusicCue(plan.id, cueId);
      const next = await api.wedding.musicPlan(plan.id);
      setPlan(next);
      await refreshPlans();
      void reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not delete cue");
    } finally {
      setBusy(false);
    }
  }

  async function onShare(enabled: boolean, rotate = false) {
    const current = await ensurePlan();
    if (!current) return;
    setBusy(true);
    setStatus(null);
    try {
      const next = await api.wedding.setMusicShare(current.id, { enabled, rotate });
      setPlan(next);
      await refreshPlans();
      setStatus(enabled ? "Share link enabled" : "Share link disabled");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not update share");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveVendor(vendorId: string | null) {
    const current = await ensurePlan();
    if (!current) return;
    setBusy(true);
    try {
      const next = await api.wedding.updateMusicPlan(current.id, {
        entertainmentVendorId: vendorId,
      });
      setPlan(next);
      await refreshPlans();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save vendor");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveVibe(vibe: MusicVibe | null) {
    const current = await ensurePlan();
    if (!current) return;
    setBusy(true);
    try {
      const next = await api.wedding.updateMusicPlan(current.id, { vibePrimary: vibe });
      setPlan(next);
      await refreshPlans();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save vibe");
    } finally {
      setBusy(false);
    }
  }

  async function messageEntertainment() {
    if (!plan?.entertainmentVendorId || !briefUrl) {
      setStatus("Enable sharing and pick a booked entertainment vendor first");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const conversation = await api.messaging.openConversation({
        type: "COUPLE_VENDOR",
        vendorId: plan.entertainmentVendorId,
      });
      await api.messaging.sendMessage(conversation.id, {
        body: `Music brief for ${event?.name ?? "our event"}:\n${briefUrl}`,
        attachments: [],
      });
      router.push(`/planning/messages?c=${conversation.id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not message vendor");
    } finally {
      setBusy(false);
    }
  }

  async function copyBrief() {
    if (!briefUrl) return;
    try {
      await navigator.clipboard.writeText(briefUrl);
      setStatus("Brief link copied");
    } catch {
      setStatus(briefUrl);
    }
  }

  if (!data) return <SignInPrompt error={error} />;

  if (!data.events?.length) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.music")} description={t("planning.musicHelp")} />
        <EmptyState
          icon={Music2}
          title={t("planning.noEvents")}
          description={t("planning.musicNeedEvent")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t("nav.music")} description={t("planning.musicHelp")} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] space-y-1">
          <Label>{t("planning.event")}</Label>
          <SimpleSelect
            value={eventId}
            onValueChange={setEventId}
            options={(data.events ?? []).map((item) => ({
              value: item.id,
              label: `${item.name} (${item.kind})`,
            }))}
          />
        </div>
        <Button type="button" disabled={busy} onClick={() => void ensurePlan()}>
          {plan ? t("planning.musicRefresh") : t("planning.musicCreate")}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void onSeedTemplates(false)}>
          {t("planning.musicSeedCues")}
        </Button>
        {(plan?.cues?.length ?? 0) > 0 ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void onSeedTemplates(true)}>
            {t("planning.musicReplaceCues")}
          </Button>
        ) : null}
      </div>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      {!plan ? (
        <EmptyState
          icon={Music2}
          title={t("planning.musicEmptyTitle")}
          description={t("planning.musicEmptyBody")}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border/60 p-4">
              <Label>{t("planning.musicVibe")}</Label>
              <SimpleSelect
                value={plan.vibePrimary ?? "__none__"}
                onValueChange={(value) => void onSaveVibe(value === "__none__" ? null : (value as MusicVibe))}
                options={[
                  { value: "__none__", label: "—" },
                  ...VIBES.map((vibe) => ({ value: vibe, label: vibe })),
                ]}
              />
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 p-4">
              <Label>{t("planning.musicEntertainment")}</Label>
              <SimpleSelect
                value={plan.entertainmentVendorId ?? "__none__"}
                onValueChange={(value) => void onSaveVendor(value === "__none__" ? null : value)}
                options={[
                  { value: "__none__", label: t("planning.musicNoVendor") },
                  ...entertainment.map((v) => ({ value: v.vendorId, label: v.name })),
                ]}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">{t("planning.musicShare")}</h2>
                <p className="text-sm text-muted-foreground">{t("planning.musicShareHelp")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.shareEnabled ? (
                  <>
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void copyBrief()}>
                      {t("planning.musicCopyLink")}
                    </Button>
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void onShare(true, true)}>
                      {t("planning.musicRotateLink")}
                    </Button>
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => void onShare(false)}>
                      {t("planning.musicDisableShare")}
                    </Button>
                    <Button type="button" disabled={busy || !plan.entertainmentVendorId} onClick={() => void messageEntertainment()}>
                      {t("planning.musicMessageVendor")}
                    </Button>
                  </>
                ) : (
                  <Button type="button" disabled={busy} onClick={() => void onShare(true)}>
                    {t("planning.musicEnableShare")}
                  </Button>
                )}
              </div>
            </div>
            {briefUrl ? (
              <p className="break-all font-mono text-xs text-muted-foreground">{briefUrl}</p>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium">{t("planning.musicLists")}</h2>
            <form className="grid gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-4" onSubmit={onAddTrack}>
              <div className="space-y-1 md:col-span-1">
                <Label>{t("planning.musicList")}</Label>
                <SimpleSelect
                  value={trackList}
                  onValueChange={(value) => setTrackList(value as MusicListKind)}
                  options={(Object.keys(LIST_LABELS) as MusicListKind[]).map((list) => ({
                    value: list,
                    label: LIST_LABELS[list],
                  }))}
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label>{t("planning.musicTitle")}</Label>
                <Input value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t("planning.musicArtist")}</Label>
                <Input value={trackArtist} onChange={(e) => setTrackArtist(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("planning.musicUrl")}</Label>
                <Input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} placeholder="https://" />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={busy}>
                  {t("planning.musicAddTrack")}
                </Button>
              </div>
            </form>

            <div className="grid gap-4 lg:grid-cols-3">
              {(Object.keys(LIST_LABELS) as MusicListKind[]).map((list) => (
                <div key={list} className="space-y-3 rounded-xl border border-border/60 p-4">
                  <h3 className="font-medium">{LIST_LABELS[list]}</h3>
                  {tracksByList[list].length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("planning.musicNoTracks")}</p>
                  ) : (
                    <ul className="space-y-2">
                      {tracksByList[list].map((track) => (
                        <li key={track.id} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p className="font-medium">{track.title}</p>
                            {track.artist ? <p className="text-muted-foreground">{track.artist}</p> : null}
                            {track.url ? (
                              <a className="text-xs underline" href={track.url} target="_blank" rel="noreferrer">
                                Link
                              </a>
                            ) : null}
                          </div>
                          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void onDeleteTrack(track.id)}>
                            {t("planning.remove")}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium">{t("planning.musicCues")}</h2>
            <form className="grid gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-2" onSubmit={onAddCue}>
              <div className="space-y-1">
                <Label>{t("planning.musicCueKind")}</Label>
                <SimpleSelect
                  value={cueKind}
                  onValueChange={(value) => setCueKind(value as MusicCueKind)}
                  options={CUE_KINDS.map((kind) => ({ value: kind, label: kind }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("planning.musicCueLabel")}</Label>
                <Input value={cueLabel} onChange={(e) => setCueLabel(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t("planning.musicCueSong")}</Label>
                <Input value={cueTrackTitle} onChange={(e) => setCueTrackTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("planning.musicCueOffset")}</Label>
                <Input value={cueOffset} onChange={(e) => setCueOffset(e.target.value)} type="number" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>{t("planning.musicCueAgenda")}</Label>
                <SimpleSelect
                  value={cueAppointmentId || "__none__"}
                  onValueChange={(value) => setCueAppointmentId(value === "__none__" ? "" : value)}
                  options={[
                    { value: "__none__", label: "—" },
                    ...agenda.map((item) => ({ value: item.id, label: item.title })),
                  ]}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={busy}>
                  {t("planning.musicAddCue")}
                </Button>
              </div>
            </form>

            {cues.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("planning.musicNoCues")}</p>
            ) : (
              <ol className="space-y-3">
                {cues.map((cue) => {
                  const startsAt = event ? resolveCueStartsAt(cue, event) : cue.startsAt;
                  return (
                    <li
                      key={cue.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/60 p-4"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{cue.kind}</p>
                        <p className="font-medium">{cue.label}</p>
                        {cue.trackTitle ? <p className="text-sm">{cue.trackTitle}</p> : null}
                        <p className="text-sm text-muted-foreground">
                          {startsAt
                            ? new Date(startsAt).toLocaleString()
                            : cue.offsetMinutes != null
                              ? `${cue.offsetMinutes} min from start`
                              : "Time TBD"}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void onDeleteCue(cue.id)}>
                        {t("planning.remove")}
                      </Button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
