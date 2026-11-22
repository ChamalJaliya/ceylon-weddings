"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Ban,
  Copy,
  Disc3,
  ExternalLink,
  Heart,
  HelpCircle,
  Link2,
  Mic2,
  Music2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@ceylonweddings/web";
import {
  agendaForEvent,
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
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { cn } from "@ceylonweddings/ui/utils";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { PlanningHero, heroButtonClass, heroSelectClass } from "@/features/planning/components/planning-hero";

const LIST_LABELS: Record<MusicListKind, string> = {
  MUST: "Must play",
  MAYBE: "Maybe",
  DO_NOT: "Do not play",
};

const LIST_STYLE: Record<MusicListKind, { chip: string; icon: typeof Heart }> = {
  MUST: { chip: "bg-primary/10 text-primary", icon: Heart },
  MAYBE: { chip: "bg-warning/10 text-warning", icon: HelpCircle },
  DO_NOT: { chip: "bg-destructive/10 text-destructive", icon: Ban },
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

const VIBES: MusicVibe[] = ["TRADITIONAL", "ROMANTIC", "UPBEAT", "BAILA", "RELIGIOUS", "SOFT", "PARTY", "CUSTOM"];

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
  const [addingCue, setAddingCue] = useState(false);

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
    api.wedding
      .appointments()
      .then(setAppointments)
      .catch(() => setAppointments([]));
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

  const event = useMemo(() => data?.events?.find((item) => item.id === eventId) ?? null, [data, eventId]);

  const agenda = useMemo(() => (eventId ? agendaForEvent(appointments, eventId) : []), [appointments, eventId]);

  const entertainment = useMemo(
    () => (data?.team ?? []).filter((v) => v.category === "ENTERTAINMENT" && v.status === "BOOKED"),
    [data?.team],
  );

  const tracksByList = useMemo(() => musicTracksByList((plan?.tracks ?? []) as MusicTrack[]), [plan?.tracks]);

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

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const pretty = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replaceAll("_", " ");
  const trackCount = (plan?.tracks ?? []).length;
  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-30";

  if (!data.events?.length) {
    return (
      <div className="cw-stack">
        <PlanningHero
          icon={Music2}
          kicker={t("hub.kicker")}
          title={t("nav.music")}
          description={t("planning.musicHelp")}
        />
        <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-serif text-2xl">{t("planning.noEvents")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("planning.musicNeedEvent")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={Music2}
        kicker={t("hub.kicker")}
        title={t("nav.music")}
        description={t("planning.musicHelp")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              shape="pill"
              size="sm"
              className={heroButtonClass}
              disabled={busy}
              onClick={() => void onSeedTemplates(false)}
            >
              <Sparkles className="size-4" /> {t("planning.musicSeedCues")}
            </Button>
            {(plan?.cues?.length ?? 0) > 0 ? (
              <Button
                type="button"
                variant="outline"
                shape="pill"
                size="sm"
                className={heroButtonClass}
                disabled={busy}
                onClick={() => void onSeedTemplates(true)}
              >
                <RefreshCw className="size-4" /> {t("planning.musicReplaceCues")}
              </Button>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="grid gap-1.5">
            <span className="text-xs text-paper/60">{t("planning.event")}</span>
            <Combobox
              aria-label={t("planning.event")}
              className={cn("w-64", heroSelectClass)}
              value={eventId}
              onValueChange={setEventId}
              searchPlaceholder="Search events…"
              options={(data.events ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
          </div>
          {plan ? (
            <>
              <div className="grid gap-1.5">
                <span className="text-xs text-paper/60">{t("planning.musicVibe")}</span>
                <Combobox
                  aria-label={t("planning.musicVibe")}
                  className={cn("w-44", heroSelectClass)}
                  value={plan.vibePrimary ?? "__none__"}
                  onValueChange={(value) => void onSaveVibe(value === "__none__" ? null : (value as MusicVibe))}
                  searchPlaceholder="Search vibes…"
                  options={[
                    { value: "__none__", label: "No vibe yet" },
                    ...VIBES.map((v) => ({ value: v, label: pretty(v) })),
                  ]}
                />
              </div>
              <div>
                <p className="text-xs text-paper/60">Songs</p>
                <p className="font-serif text-2xl">{trackCount}</p>
              </div>
              <div>
                <p className="text-xs text-paper/60">Cues</p>
                <p className="font-serif text-2xl">{cues.length}</p>
              </div>
            </>
          ) : null}
        </div>
      </PlanningHero>

      {status ? <FormStatus>{status}</FormStatus> : null}

      {!plan ? (
        <div className="grid place-items-center gap-4 rounded-3xl border border-dashed border-border p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Music2 className="size-6" />
          </span>
          <div>
            <p className="font-serif text-2xl">{t("planning.musicEmptyTitle")}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("planning.musicEmptyBody")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button shape="pill" disabled={busy} onClick={() => void ensurePlan()}>
              {t("planning.musicCreate")}
            </Button>
            <Button
              shape="pill"
              variant="outline"
              className="gap-2"
              disabled={busy}
              onClick={() => void onSeedTemplates(false)}
            >
              <Sparkles className="size-4" /> {t("planning.musicSeedCues")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Who's playing + share brief */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="text-label tracking-eyebrow text-muted-foreground uppercase">
                {t("planning.musicEntertainment")}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Mic2 className="size-5" />
                </span>
                <Combobox
                  aria-label={t("planning.musicEntertainment")}
                  className="flex-1"
                  value={plan.entertainmentVendorId ?? "__none__"}
                  onValueChange={(value) => void onSaveVendor(value === "__none__" ? null : value)}
                  searchPlaceholder="Search vendors…"
                  options={[
                    { value: "__none__", label: t("planning.musicNoVendor") },
                    ...entertainment.map((v) => ({ value: v.vendorId, label: v.name })),
                  ]}
                />
              </div>
            </section>

            <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-label tracking-eyebrow text-muted-foreground uppercase">
                    {t("planning.musicShare")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("planning.musicShareHelp")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={plan.shareEnabled}
                  aria-label={plan.shareEnabled ? t("planning.musicDisableShare") : t("planning.musicEnableShare")}
                  disabled={busy}
                  onClick={() => void onShare(!plan.shareEnabled)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    plan.shareEnabled ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
                      plan.shareEnabled && "translate-x-5",
                    )}
                  />
                </button>
              </div>
              {briefUrl ? (
                <div className="mt-3 grid min-w-0 gap-2">
                  <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-secondary/60 py-1.5 pr-1.5 pl-3">
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{briefUrl}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      shape="pill"
                      className="gap-1.5"
                      disabled={busy}
                      onClick={() => void copyBrief()}
                    >
                      <Copy className="size-3.5" /> {t("planning.musicCopyLink")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      shape="pill"
                      className="gap-1.5"
                      disabled={busy || !plan.entertainmentVendorId}
                      onClick={() => void messageEntertainment()}
                    >
                      <Send className="size-3.5" /> {t("planning.musicMessageVendor")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      shape="pill"
                      className="gap-1.5"
                      disabled={busy}
                      onClick={() => void onShare(true, true)}
                    >
                      <RefreshCw className="size-3.5" /> {t("planning.musicRotateLink")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          {/* Cue timeline */}
          <section className="grid gap-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{t("planning.musicCues")}</p>
                <p className="text-sm text-muted-foreground">
                  When each song plays during {event?.name ?? "the event"}.
                </p>
              </div>
              {!addingCue ? (
                <Button size="sm" shape="pill" variant="outline" className="gap-1.5" onClick={() => setAddingCue(true)}>
                  <Plus className="size-4" /> {t("planning.musicAddCue")}
                </Button>
              ) : null}
            </div>

            {addingCue ? (
              <form
                onSubmit={(e) => void onAddCue(e).then(() => setAddingCue(false))}
                className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-card sm:grid-cols-2"
              >
                <label className="grid gap-1 text-xs text-muted-foreground">
                  {t("planning.musicCueKind")}
                  <Combobox
                    value={cueKind}
                    onValueChange={(value) => setCueKind(value as MusicCueKind)}
                    searchPlaceholder="Search moments…"
                    options={CUE_KINDS.map((kind) => ({ value: kind, label: pretty(kind) }))}
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  {t("planning.musicCueLabel")}
                  <Input
                    value={cueLabel}
                    onChange={(e) => setCueLabel(e.target.value)}
                    placeholder="e.g. Bride walks to the Poruwa"
                    required
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  {t("planning.musicCueSong")}
                  <Input value={cueTrackTitle} onChange={(e) => setCueTrackTitle(e.target.value)} />
                </label>
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    {t("planning.musicCueAgenda")}
                    <Combobox
                      value={cueAppointmentId || "__none__"}
                      onValueChange={(value) => setCueAppointmentId(value === "__none__" ? "" : value)}
                      searchPlaceholder="Search agenda…"
                      options={[
                        { value: "__none__", label: "Event start" },
                        ...agenda.map((item) => ({ value: item.id, label: item.title })),
                      ]}
                    />
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground">
                    + minutes
                    <Input value={cueOffset} onChange={(e) => setCueOffset(e.target.value)} type="number" />
                  </label>
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button type="button" variant="ghost" shape="pill" onClick={() => setAddingCue(false)}>
                    {t("knotly.cancel")}
                  </Button>
                  <Button type="submit" shape="pill" disabled={busy}>
                    {t("planning.musicAddCue")}
                  </Button>
                </div>
              </form>
            ) : null}

            {cues.length === 0 ? (
              <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">{t("planning.musicNoCues")}</p>
                <Button
                  size="sm"
                  shape="pill"
                  className="gap-2"
                  disabled={busy}
                  onClick={() => void onSeedTemplates(false)}
                >
                  <Sparkles className="size-4" /> {t("planning.musicSeedCues")}
                </Button>
              </div>
            ) : (
              <ol className="relative grid gap-3">
                <span aria-hidden className="absolute top-4 bottom-4 left-[5.25rem] w-px bg-border" />
                {cues.map((cue) => {
                  const startsAt = event ? resolveCueStartsAt(cue, event) : cue.startsAt;
                  return (
                    <li key={cue.id} className="group relative grid grid-cols-[4.5rem_1fr] gap-6">
                      <div className="pt-4 text-right">
                        <p className="font-serif text-lg leading-none tabular-nums">
                          {startsAt ? fmtTime(startsAt) : "—"}
                        </p>
                        {!startsAt && cue.offsetMinutes != null ? (
                          <p className="mt-1 text-xs text-muted-foreground">+{cue.offsetMinutes} min</p>
                        ) : null}
                      </div>
                      <span
                        aria-hidden
                        className="absolute top-5 left-[5.25rem] size-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
                      />
                      <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{cue.label}</p>
                            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                              {pretty(cue.kind)}
                            </span>
                          </div>
                          {cue.trackTitle ? (
                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-primary">
                              <Music2 className="size-3.5" /> {cue.trackTitle}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm text-muted-foreground">No song picked yet</p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={t("planning.remove")}
                          disabled={busy}
                          onClick={() => void onDeleteCue(cue.id)}
                          className={cn(iconBtn, "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Song lists */}
          <section className="grid gap-4">
            <p className="font-serif text-2xl">{t("planning.musicLists")}</p>
            <form
              onSubmit={onAddTrack}
              className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-2 shadow-card lg:flex-row lg:items-center"
            >
              <div className="inline-flex shrink-0 rounded-full bg-secondary p-1">
                {(Object.keys(LIST_LABELS) as MusicListKind[]).map((list) => (
                  <button
                    key={list}
                    type="button"
                    onClick={() => setTrackList(list)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm transition-colors",
                      trackList === list ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {LIST_LABELS[list]}
                  </button>
                ))}
              </div>
              <Input
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder={t("planning.musicTitle")}
                required
              />
              <Input
                value={trackArtist}
                onChange={(e) => setTrackArtist(e.target.value)}
                placeholder={t("planning.musicArtist")}
                className="lg:w-44"
              />
              <Input
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="Link (optional)"
                className="lg:w-44"
              />
              <Button type="submit" shape="pill" className="shrink-0 gap-1.5" disabled={busy}>
                <Plus className="size-4" /> Add
              </Button>
            </form>

            <div className="grid gap-4 lg:grid-cols-3">
              {(Object.keys(LIST_LABELS) as MusicListKind[]).map((list) => (
                <section key={list} className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                  <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                    <span className={cn("grid size-9 place-items-center rounded-xl", LIST_STYLE[list].chip)}>
                      {(() => {
                        const I = LIST_STYLE[list].icon;
                        return <I className="size-4" />;
                      })()}
                    </span>
                    <p className="flex-1 font-medium">{LIST_LABELS[list]}</p>
                    <span className="text-sm text-muted-foreground tabular-nums">{tracksByList[list].length}</span>
                  </header>
                  {tracksByList[list].length === 0 ? (
                    <p className="px-5 py-6 text-sm text-muted-foreground">{t("planning.musicNoTracks")}</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {tracksByList[list].map((track) => (
                        <li key={track.id} className="group flex items-center gap-3 px-5 py-3">
                          <Disc3 className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{track.title}</p>
                            {track.artist ? (
                              <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                            ) : null}
                          </div>
                          {track.url ? (
                            <a
                              href={track.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${track.title}`}
                              className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            aria-label={t("planning.remove")}
                            disabled={busy}
                            onClick={() => void onDeleteTrack(track.id)}
                            className={cn(iconBtn, "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
