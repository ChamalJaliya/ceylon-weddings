"use client";

import type { ReactNode } from "react";
import { CoupleOnboardingGate } from "../../../components/couple-onboarding-gate";

export default function PlanningLayout({ children }: { children: ReactNode }) {
  return <CoupleOnboardingGate>{children}</CoupleOnboardingGate>;
}
