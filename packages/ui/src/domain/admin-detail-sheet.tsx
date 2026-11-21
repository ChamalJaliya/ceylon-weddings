"use client";

import type { ReactNode } from "react";
import { FloatingPanel, FloatingPanelBody, FloatingPanelContent, FloatingPanelHeader } from "./floating-panel";

export function AdminDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <FloatingPanel open={open} onOpenChange={onOpenChange}>
      <FloatingPanelContent side="right" width="32rem">
        <FloatingPanelHeader title={title} description={description} />
        <FloatingPanelBody className="gap-4">{children}</FloatingPanelBody>
      </FloatingPanelContent>
    </FloatingPanel>
  );
}
