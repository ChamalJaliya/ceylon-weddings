"use client";

import { ThemeProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { ConfirmProvider } from "@ceylonweddings/ui/components/confirm-dialog";
import { Toaster } from "@ceylonweddings/ui/components/toaster";
import { CwMotionProvider } from "@ceylonweddings/ui/domain/motion";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster dark={resolvedTheme === "night"} />;
}

/**
 * App-wide providers: theme, motion, confirm dialogs (useConfirm) and toasts.
 * Mounted once in apps/web/src/app/[locale]/layout.tsx.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="pearl" themes={["pearl", "temple", "night"]} enableSystem={false}>
      <CwMotionProvider>
        <ConfirmProvider>
          {children}
          <ThemedToaster />
        </ConfirmProvider>
      </CwMotionProvider>
    </ThemeProvider>
  );
}
