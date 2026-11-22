"use client";

import { CalendarDays, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Appointment, CreateAppointmentBody, Event, WeddingVendor } from "@ceylonweddings/contracts";
import { AppModal } from "@ceylonweddings/ui/components/app-modal";
import { Button } from "@ceylonweddings/ui/components/button";
import { Link } from "@/i18n/navigation";
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
  canEdit = true,
  onSubmit,
  onDelete,
  onDuplicate,
  onAddPrepTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Partial<AppointmentEditorValue> | Appointment;
  team: WeddingVendor[];
  events: Event[];
  busy?: boolean;
  canEdit?: boolean;
  onSubmit: (body: CreateAppointmentBody) => Promise<void> | void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddPrepTask?: () => void;
}) {
  const t = useTranslations();
  const editing = mode === "edit" && initial && "id" in initial ? (initial as Appointment) : null;
  const draftKey =
    editing?.id ??
    `create-${(initial as AppointmentEditorValue | undefined)?.startsAt ?? "new"}-${(initial as AppointmentEditorValue | undefined)?.endsAt ?? ""}`;
  const agendaHref =
    editing?.eventId && editing.id ? `/planning/agenda?eventId=${editing.eventId}&highlight=${editing.id}` : null;

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
          {canEdit && mode === "edit" && onDelete ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onDelete}>
              {t("planning.remove")}
            </Button>
          ) : null}
          {canEdit && mode === "edit" && onDuplicate ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onDuplicate}>
              {t("knotly.duplicate")}
            </Button>
          ) : null}
          {canEdit && mode === "edit" && onAddPrepTask ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={onAddPrepTask}>
              {t("knotly.addPrepTask")}
            </Button>
          ) : null}
          {agendaHref ? (
            <Button asChild type="button" variant="ghost" disabled={busy}>
              <Link href={agendaHref} title={t("knotly.openAgenda")}>
                <ClipboardList className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5">{t("knotly.openAgenda")}</span>
              </Link>
            </Button>
          ) : null}
          <span className="flex-1" />
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {t("knotly.cancel")}
          </Button>
          {canEdit ? (
            <Button type="submit" form={FORM_ID} disabled={busy}>
              {busy ? "…" : mode === "edit" ? t("planning.save") : t("knotly.add")}
            </Button>
          ) : null}
        </>
      }
    >
      <AppointmentEditor
        key={draftKey}
        mode={mode}
        initial={initial}
        team={team}
        events={events}
        busy={busy || !canEdit}
        formId={FORM_ID}
        hideActions
        onSubmit={async (body) => {
          if (!canEdit) return;
          await onSubmit(body);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </AppModal>
  );
}
