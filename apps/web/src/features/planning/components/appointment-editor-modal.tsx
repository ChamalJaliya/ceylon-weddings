"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Appointment, CreateAppointmentBody, Event, WeddingVendor } from "@ceylonweddings/contracts";
import { AppModal } from "@ceylonweddings/ui/components/app-modal";
import { Button } from "@ceylonweddings/ui/components/button";
import { AppointmentEditor, type AppointmentEditorValue } from "@/features/planning/components/appointment-editor";

const FORM_ID = "appointment-editor-modal";

export function AppointmentEditorModal({
  open,
  onOpenChange,
  mode,
  initial,
  team,
  events,
  busy = false,
  onSubmit,
  onDelete,
  onDuplicate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Partial<AppointmentEditorValue> | Appointment;
  team: WeddingVendor[];
  events: Event[];
  busy?: boolean;
  onSubmit: (body: CreateAppointmentBody) => Promise<void> | void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const t = useTranslations();
  const editing = mode === "edit" && initial && "id" in initial ? (initial as Appointment) : null;
  const draftKey =
    editing?.id ??
    `create-${(initial as AppointmentEditorValue | undefined)?.startsAt ?? "new"}-${(initial as AppointmentEditorValue | undefined)?.endsAt ?? ""}`;

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
      title={mode === "edit" ? t("knotly.editAppointment") : t("knotly.addMeeting")}
      description={mode === "create" ? "Name it, set the time, and you’re done." : (editing?.vendorName ?? undefined)}
      icon={CalendarDays}
      size="md"
      bodyClassName="px-1"
      preventOutsideClose={busy}
      footer={
        <>
          {mode === "edit" && onDelete ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onDelete}>
              {t("planning.remove")}
            </Button>
          ) : null}
          {mode === "edit" && onDuplicate ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onDuplicate}>
              {t("knotly.duplicate")}
            </Button>
          ) : null}
          <span className="flex-1" />
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {t("knotly.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy}>
            {busy ? "…" : mode === "edit" ? t("planning.save") : t("knotly.add")}
          </Button>
        </>
      }
    >
      <AppointmentEditor
        key={draftKey}
        mode={mode}
        initial={initial}
        team={team}
        events={events}
        busy={busy}
        formId={FORM_ID}
        hideActions
        onSubmit={async (body) => {
          await onSubmit(body);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </AppModal>
  );
}
