"use client";

import { Suspense } from "react";
import { MessagesPage } from "../../../../components/messages-page";

export default function ProMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPage supportType="VENDOR_ADMIN" />
    </Suspense>
  );
}
