"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  CONSULTATION_MODE_LABELS,
  CONSULTATION_WEEKDAY_KEYS,
  DEFAULT_CONSULTATION_SETTINGS,
  type ConsultationMode,
  type ConsultationSettings,
  type ConsultationWeekdayKey,
  type ConsultationWindow,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

const WEEKDAY_LABELS: Record<ConsultationWeekdayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const MODE_OPTIONS = Object.keys(CONSULTATION_MODE_LABELS) as ConsultationMode[];

export default function AdminConsultationSettingsPage() {
  const [settings, setSettings] = useState<ConsultationSettings>(DEFAULT_CONSULTATION_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [blackoutDraft, setBlackoutDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const config = await api.admin.siteConfig();
      setSettings(config.consultations ?? DEFAULT_CONSULTATION_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const config = await api.admin.siteConfig();
      await api.admin.updateSiteConfig({
        branding: config.branding,
        homepage: config.homepage,
        onboarding: config.onboarding,
        consultations: settings,
      });
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function setWindows(day: ConsultationWeekdayKey, windows: ConsultationWindow[]) {
    setSettings({ ...settings, weekly: { ...settings.weekly, [day]: windows } });
  }

  function toggleMode(mode: ConsultationMode) {
    const next = settings.modes.includes(mode)
      ? settings.modes.filter((item) => item !== mode)
      : [...settings.modes, mode];
    setSettings({ ...settings, modes: next.length > 0 ? next : settings.modes });
  }

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={CalendarClock}
        kicker="Settings"
        title="Consultation hours"
        description="Weekly availability, slot length, and how guests can talk to the team."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/consultations">Open bookings</Link>
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save availability"}
            </Button>
          </div>
        }
      />
      {status ? <FormStatus>{status}</FormStatus> : null}

      <SectionCard title="Booking window" icon={CalendarClock}>
        <div className="grid gap-4">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Accept public bookings</p>
              <p className="text-xs text-muted-foreground">Turn off to hide /consultation without changing hours.</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Confirm instantly</p>
              <p className="text-xs text-muted-foreground">Off keeps new bookings as pending until you confirm.</p>
            </div>
            <Switch
              checked={settings.autoConfirm}
              onCheckedChange={(checked) => setSettings({ ...settings, autoConfirm: checked })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="Slot length (minutes)"
              value={settings.slotMinutes}
              onChange={(slotMinutes) => setSettings({ ...settings, slotMinutes })}
            />
            <NumberField
              label="Buffer (minutes)"
              value={settings.bufferMinutes}
              onChange={(bufferMinutes) => setSettings({ ...settings, bufferMinutes })}
            />
            <NumberField
              label="Lead time (hours)"
              value={settings.leadTimeHours}
              onChange={(leadTimeHours) => setSettings({ ...settings, leadTimeHours })}
            />
            <NumberField
              label="Horizon (days)"
              value={settings.horizonDays}
              onChange={(horizonDays) => setSettings({ ...settings, horizonDays })}
            />
            <NumberField
              label="Max bookings per day"
              value={settings.maxPerDay}
              onChange={(maxPerDay) => setSettings({ ...settings, maxPerDay })}
            />
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Default video link</span>
              <Input
                value={settings.defaultMeetingUrl ?? ""}
                onChange={(event) => setSettings({ ...settings, defaultMeetingUrl: event.target.value || null })}
                placeholder="https://meet.google.com/…"
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Formats guests can pick</p>
            <div className="flex flex-wrap gap-2">
              {MODE_OPTIONS.map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={settings.modes.includes(mode) ? "default" : "outline"}
                  onClick={() => toggleMode(mode)}
                >
                  {CONSULTATION_MODE_LABELS[mode]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Weekly hours" icon={CalendarClock}>
        <div className="grid gap-4">
          {CONSULTATION_WEEKDAY_KEYS.map((day) => (
            <div key={day} className="rounded-xl border border-border/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-medium">{WEEKDAY_LABELS[day]}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setWindows(day, [...settings.weekly[day], { start: "09:00", end: "17:00" }])}
                >
                  Add window
                </Button>
              </div>
              {settings.weekly[day].length === 0 ? (
                <p className="text-sm text-muted-foreground">Closed</p>
              ) : (
                <div className="grid gap-2">
                  {settings.weekly[day].map((window, index) => (
                    <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        className="w-32"
                        value={window.start}
                        onChange={(event) => {
                          const next = settings.weekly[day].map((item, itemIndex) =>
                            itemIndex === index ? { ...item, start: event.target.value } : item,
                          );
                          setWindows(day, next);
                        }}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={window.end}
                        onChange={(event) => {
                          const next = settings.weekly[day].map((item, itemIndex) =>
                            itemIndex === index ? { ...item, end: event.target.value } : item,
                          );
                          setWindows(day, next);
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setWindows(day, settings.weekly[day].filter((_, itemIndex) => itemIndex !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Blackout dates" icon={CalendarClock}>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              className="w-48"
              value={blackoutDraft}
              onChange={(event) => setBlackoutDraft(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (!blackoutDraft || settings.blackoutDates.includes(blackoutDraft)) return;
                setSettings({
                  ...settings,
                  blackoutDates: [...settings.blackoutDates, blackoutDraft].sort(),
                });
                setBlackoutDraft("");
              }}
            >
              Add date
            </Button>
          </div>
          {settings.blackoutDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blackout dates.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {settings.blackoutDates.map((date) => (
                <li key={date}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        blackoutDates: settings.blackoutDates.filter((item) => item !== date),
                      })
                    }
                  >
                    {date} ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Public copy" icon={CalendarClock}>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Title</span>
            <Input
              value={settings.intro.title}
              onChange={(event) =>
                setSettings({ ...settings, intro: { ...settings.intro, title: event.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Body</span>
            <Textarea
              rows={3}
              value={settings.intro.body}
              onChange={(event) =>
                setSettings({ ...settings, intro: { ...settings.intro, body: event.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Duration note</span>
            <Input
              value={settings.intro.durationNote}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  intro: { ...settings.intro, durationNote: event.target.value },
                })
              }
            />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
