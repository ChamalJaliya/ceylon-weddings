"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  TEAM_VENDOR_NONE,
  appointmentKindSchema,
  reminderPresetOptions,
  teamVendorPickerOptions,
  type Appointment,
  type AppointmentKind,
  type CreateAppointmentBody,
  type Event,
  type WeddingVendor,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { DateTimePicker } from "@ceylonweddings/ui/components/date-picker";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { FieldBlock, StudioCollapse } from "@ceylonweddings/ui/domain/creator-form";

/** Default appointment colours — saved onto the record (user data). design-system: user-data-colors */
export const KIND_COLOR: Record<AppointmentKind, string> = {
  VENDOR_MEETING: "#c4e0ff",
  TASTING: "#d8f0c8",
  FITTING: "#f7d4e0",
  CEREMONY: "#e4d4f5",
  DAY_OF: "#fde68a",
  OTHER: "#fde68a",
};

export type AppointmentEditorValue = {
  title: string;
  kind: AppointmentKind;
  startsAt: string;
  endsAt: string;
  venueName: string;
  address: string;
  notes: string;
  reminderMinutes: number;
  vendorId: string | null;
  eventId: string | null;
  ownerLabel: string;
  color: string | null;
  sortOrder?: number;
};

const emptyValue = (defaults?: Partial<AppointmentEditorValue>): AppointmentEditorValue => ({
  title: "",
  kind: "VENDOR_MEETING",
  startsAt: "",
  endsAt: "",
  venueName: "",
  address: "",
  notes: "",
  reminderMinutes: 30,
  vendorId: null,
  eventId: null,
  ownerLabel: "",
  color: KIND_COLOR.VENDOR_MEETING,
  ...defaults,
});

function hasExtraDetails(
  value: Pick<
    AppointmentEditorValue,
    "venueName" | "address" | "notes" | "vendorId" | "eventId" | "ownerLabel" | "reminderMinutes"
  >,
) {
  return Boolean(
    value.venueName.trim() ||
    value.address.trim() ||
    value.notes.trim() ||
    value.vendorId ||
    value.eventId ||
    value.ownerLabel.trim() ||
    value.reminderMinutes !== 30,
  );
}

export function appointmentToEditorValue(appt: Appointment): AppointmentEditorValue {
  return {
    title: appt.title,
    kind: appt.kind,
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    venueName: appt.venueName ?? "",
    address: appt.address ?? "",
    notes: appt.notes ?? "",
    reminderMinutes: appt.reminderMinutes,
    vendorId: appt.vendorId,
    eventId: appt.eventId ?? null,
    ownerLabel: appt.ownerLabel ?? "",
    color: appt.color ?? KIND_COLOR[appt.kind],
    sortOrder: appt.sortOrder,
  };
}

export function editorValueToBody(value: AppointmentEditorValue): CreateAppointmentBody {
  return {
    title: value.title.trim(),
    kind: value.kind,
    startsAt: new Date(value.startsAt).toISOString(),
    endsAt: new Date(value.endsAt).toISOString(),
    venueName: value.venueName.trim() || null,
    address: value.address.trim() || null,
    notes: value.notes.trim() || null,
    reminderMinutes: value.reminderMinutes,
    vendorId: value.vendorId,
    eventId: value.eventId,
    color: value.color ?? KIND_COLOR[value.kind],
    sortOrder: value.sortOrder,
    ownerLabel: value.ownerLabel.trim() || null,
  };
}

export function AppointmentEditor({
  mode,
  initial,
  team,
  events,
  showOwner = false,
  showEvent = true,
  submitLabel,
  onSubmit,
  onCancel,
  busy = false,
  formId,
  hideActions = false,
}: {
  mode: "create" | "edit";
  initial?: Partial<AppointmentEditorValue> | Appointment;
  team: WeddingVendor[];
  events: Event[];
  showOwner?: boolean;
  showEvent?: boolean;
  submitLabel?: string;
  onSubmit: (body: CreateAppointmentBody) => Promise<void> | void;
  onCancel?: () => void;
  busy?: boolean;
  /** When set (e.g. in AppModal), footer buttons can submit via `form={formId}`. */
  formId?: string;
  /** Hide built-in submit/cancel — use when actions live in a modal footer. */
  hideActions?: boolean;
}) {
  const t = useTranslations();
  const appointmentId = initial && "id" in initial ? (initial as Appointment).id : null;

  const [value, setValue] = useState<AppointmentEditorValue>(() => {
    if (appointmentId && initial) return appointmentToEditorValue(initial as Appointment);
    return emptyValue(initial as Partial<AppointmentEditorValue> | undefined);
  });
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(() => {
    if (appointmentId && initial && "id" in initial) {
      return hasExtraDetails(appointmentToEditorValue(initial as Appointment));
    }
    const partial = (initial as Partial<AppointmentEditorValue> | undefined) ?? {};
    return hasExtraDetails({
      venueName: partial.venueName ?? "",
      address: partial.address ?? "",
      notes: partial.notes ?? "",
      vendorId: partial.vendorId ?? null,
      eventId: partial.eventId ?? null,
      ownerLabel: partial.ownerLabel ?? "",
      reminderMinutes: partial.reminderMinutes ?? 30,
    });
  });

  useEffect(() => {
    if (!appointmentId || !initial || !("id" in initial)) return;
    const next = appointmentToEditorValue(initial as Appointment);
    setValue(next);
    setDetailsOpen(hasExtraDetails(next));
    // Only re-hydrate when switching which appointment is edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: identity of `initial` changes every render
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) return;
    const partial = initial as Partial<AppointmentEditorValue> | undefined;
    const nextEventId = partial?.eventId ?? null;
    setValue((prev) => (prev.eventId === nextEventId ? prev : { ...prev, eventId: nextEventId }));
  }, [appointmentId, (initial as Partial<AppointmentEditorValue> | undefined)?.eventId]);

  const vendorOptions = useMemo(() => teamVendorPickerOptions(team), [team]);
  const reminderOptions = useMemo(
    () =>
      reminderPresetOptions().map((preset) => ({
        value: preset.value,
        label: t(`knotly.${preset.labelKey}`),
      })),
    [t],
  );

  function patch(partial: Partial<AppointmentEditorValue>) {
    setValue((prev) => {
      const next = { ...prev, ...partial };
      if (partial.kind && !partial.color) {
        next.color = KIND_COLOR[partial.kind];
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!value.title.trim() || !value.startsAt || !value.endsAt) {
      setError(t("knotly.appointmentRequired"));
      return;
    }
    try {
      await onSubmit(editorValueToBody(value));
      if (mode === "create") {
        setValue(emptyValue({ kind: value.kind, eventId: value.eventId, reminderMinutes: value.reminderMinutes }));
        setDetailsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("knotly.appointmentSaveFailed"));
    }
  }

  return (
    <form id={formId} className="grid gap-7" onSubmit={(e) => void handleSubmit(e)}>
      <section className="grid gap-5">
        <FieldBlock label={t("knotly.appointmentTitle")} hint="What should appear on the calendar.">
          <Input
            value={value.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder={t("knotly.addMeeting")}
            required
            disabled={busy}
            className="h-11"
            autoFocus={mode === "create"}
          />
        </FieldBlock>

        <FieldBlock label={t("knotly.appointmentKind")}>
          <SimpleSelect
            value={value.kind}
            onValueChange={(next) => patch({ kind: next as AppointmentKind })}
            options={appointmentKindSchema.options.map((kind) => ({
              value: kind,
              label: kind.replaceAll("_", " "),
            }))}
            disabled={busy}
          />
        </FieldBlock>

        <div className="grid gap-5 sm:grid-cols-2">
          <FieldBlock label={t("knotly.starts")}>
            <DateTimePicker value={value.startsAt} onChange={(startsAt) => patch({ startsAt })} disabled={busy} />
          </FieldBlock>
          <FieldBlock label={t("knotly.ends")}>
            <DateTimePicker value={value.endsAt} onChange={(endsAt) => patch({ endsAt })} disabled={busy} />
          </FieldBlock>
        </div>
      </section>

      <StudioCollapse
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="Place & details"
        subtitle="Venue, vendor, reminder, and notes — only if you need them."
      >
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock label={t("planning.venue")}>
              <Input
                value={value.venueName}
                onChange={(e) => patch({ venueName: e.target.value })}
                placeholder={t("planning.venue")}
                disabled={busy}
              />
            </FieldBlock>
            <FieldBlock label={t("knotly.address")}>
              <Input
                value={value.address}
                onChange={(e) => patch({ address: e.target.value })}
                placeholder={t("knotly.address")}
                disabled={busy}
              />
            </FieldBlock>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock label={t("knotly.vendorOptional")}>
              <SimpleSelect
                value={value.vendorId ?? TEAM_VENDOR_NONE}
                onValueChange={(next) => patch({ vendorId: next === TEAM_VENDOR_NONE ? null : next })}
                options={[
                  { value: TEAM_VENDOR_NONE, label: t("knotly.vendorNone") },
                  ...vendorOptions.map((option) => ({ value: option.value, label: option.label })),
                ]}
                disabled={busy}
              />
            </FieldBlock>
            {showEvent ? (
              <FieldBlock label={t("knotly.eventOptional")}>
                <SimpleSelect
                  value={value.eventId ?? TEAM_VENDOR_NONE}
                  onValueChange={(next) => patch({ eventId: next === TEAM_VENDOR_NONE ? null : next })}
                  options={[
                    { value: TEAM_VENDOR_NONE, label: t("knotly.eventNone") },
                    ...events.map((event) => ({ value: event.id, label: event.name })),
                  ]}
                  disabled={busy}
                />
                {!value.eventId ? (
                  <p className="mt-1.5 text-caption text-muted-foreground">{t("knotly.attachToCeremonyHint")}</p>
                ) : null}
              </FieldBlock>
            ) : null}
          </div>

          <FieldBlock label={t("knotly.reminder")}>
            <SimpleSelect
              value={String(value.reminderMinutes)}
              onValueChange={(next) => patch({ reminderMinutes: Number(next) })}
              options={reminderOptions}
              disabled={busy}
            />
          </FieldBlock>

          {showOwner ? (
            <FieldBlock label={t("knotly.ownerLabel")}>
              <Input
                value={value.ownerLabel}
                onChange={(e) => patch({ ownerLabel: e.target.value })}
                placeholder={t("knotly.ownerPlaceholder")}
                disabled={busy}
              />
            </FieldBlock>
          ) : null}

          <FieldBlock label={t("knotly.notes")}>
            <Textarea
              value={value.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder={t("knotly.notesPlaceholder")}
              rows={3}
              disabled={busy}
            />
          </FieldBlock>
        </div>
      </StudioCollapse>

      {hideActions ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {submitLabel ?? (mode === "edit" ? t("planning.save") : t("knotly.add"))}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>
              {t("knotly.cancel")}
            </Button>
          ) : null}
        </div>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
