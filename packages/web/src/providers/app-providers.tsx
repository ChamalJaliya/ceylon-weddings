"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { CwMotionProvider } from "@ceylonweddings/ui/domain/motion";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="pearl" themes={["pearl", "temple", "night"]} enableSystem={false}>
      <CwMotionProvider>{children}</CwMotionProvider>
    </ThemeProvider>
  );
}
