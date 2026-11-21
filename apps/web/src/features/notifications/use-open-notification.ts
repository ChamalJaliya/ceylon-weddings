"use client";

import { useCallback } from "react";
import type { AppNotification } from "@ceylonweddings/contracts";
import { api, useMessagingStore } from "@ceylonweddings/web";
import { useRouter } from "@/i18n/navigation";

/** Mark read (optimistically) and go to the notification's target. */
export function useOpenNotification(onDone?: () => void) {
  const router = useRouter();
  const markLocal = useMessagingStore((state) => state.markNotificationLocalRead);
  return useCallback(
    (item: AppNotification) => {
      if (!item.readAt) {
        markLocal(item.id);
        void api.notifications.markRead({ ids: [item.id] }).catch(() => undefined);
      }
      onDone?.();
      if (item.href) router.push(item.href);
    },
    [markLocal, onDone, router],
  );
}
