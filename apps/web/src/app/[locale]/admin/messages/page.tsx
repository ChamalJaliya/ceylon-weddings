"use client";

import { Suspense } from "react";
import { MessagesPage } from "../../../../components/messages-page";

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPage />
    </Suspense>
  );
}
