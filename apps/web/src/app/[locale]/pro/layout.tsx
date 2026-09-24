"use client";

import type { ReactNode } from "react";
import { ProOnboardingGate } from "../../../components/pro-onboarding-gate";

export default function ProLayout({ children }: { children: ReactNode }) {
  return <ProOnboardingGate>{children}</ProOnboardingGate>;
}
