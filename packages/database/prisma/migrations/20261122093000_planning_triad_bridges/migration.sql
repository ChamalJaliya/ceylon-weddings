-- Appointment source tagging (idempotent nekath regenerate) + Task↔Appointment soft link

CREATE TYPE "AppointmentSource" AS ENUM ('MANUAL', 'NEKATH');

ALTER TABLE "Appointment" ADD COLUMN "source" "AppointmentSource" NOT NULL DEFAULT 'MANUAL';

CREATE INDEX "Appointment_eventId_source_idx" ON "Appointment"("eventId", "source");

ALTER TABLE "Task" ADD COLUMN "appointmentId" TEXT;

CREATE INDEX "Task_appointmentId_idx" ON "Task"("appointmentId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
