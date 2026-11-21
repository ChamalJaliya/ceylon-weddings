"use client";

import { Toaster as Sonner, toast } from "sonner";

/**
 * Mutation outcomes (save, delete, send, export) → toast.success / toast.error.
 * Keep inline FormStatus for field validation. Mounted once by AppProviders.
 */
export function Toaster({ dark = false }: { dark?: boolean }) {
  return (
    <Sonner
      theme={dark ? "dark" : "light"}
      position="top-right"
      closeButton
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          closeButton: "cw-toast__close",
          actionButton: "button button--primary button--sm",
          cancelButton: "button button--ghost button--sm",
          toast: "cw-toast",
          title: "cw-toast__title",
          description: "cw-toast__description",
          success: "cw-toast--success",
          error: "cw-toast--error",
          warning: "cw-toast--warning",
          info: "cw-toast--info",
        },
      }}
    />
  );
}

export { toast };
