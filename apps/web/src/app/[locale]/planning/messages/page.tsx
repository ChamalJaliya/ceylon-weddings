"use client";

import { Suspense } from "react";
import { MessagesPage } from "../../../../components/messages-page";

export default function PlanningMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPage supportType="COUPLE_ADMIN" />
    </Suspense>
  );
}
