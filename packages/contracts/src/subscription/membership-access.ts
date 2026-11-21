import { z } from "zod";
import {
  DEFAULT_GRACE_DAYS,
  TRIAL_VENDOR_CAPS,
  DEFAULT_VENDOR_PLAN_LIMITS,
  VENDOR_PLAN_SLUGS,
  canonicalizeVendorPlanSlug,
  type VendorPlanLimits,
  type VendorPlanSlug,
} from "./plan-catalog";
import { subscriptionStatusSchema, type SubscriptionStatus } from "../vendor/enums";

export const billingAlertSchema = z.enum([
  "none",
  "trial_ending",
  "trial_active",
  "grace",
  "expired",
  "canceling",
  "comped",
]);

export type BillingAlert = z.infer<typeof billingAlertSchema>;

/** Statuses that keep a vendor visible / Pro-capable. */
export const MEMBERSHIP_ACCESS_STATUSES: readonly SubscriptionStatus[] = [
  "TRIAL",
  "ACTIVE",
  "GRACE",
  "COMPED",
] as const;

export function hasMembershipAccess(status: string): boolean {
  return (MEMBERSHIP_ACCESS_STATUSES as readonly string[]).includes(status);
}

export function canAppearInCatalog(status: string): boolean {
  return hasMembershipAccess(status);
}

export function canUseProFeatures(status: string): boolean {
  return hasMembershipAccess(status);
}

export function canMutateStorefront(status: string): boolean {
  // Grace still allows edits so vendors can fix listing while paying.
  return status === "TRIAL" || status === "ACTIVE" || status === "GRACE" || status === "COMPED";
}

export type ResolveEffectiveStatusInput = {
  status: string;
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  gracePeriodDays?: number | null;
  compedUntil?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  now?: Date;
};

export type ResolveEffectiveStatusResult = {
  status: SubscriptionStatus;
  daysRemaining: number;
  billingAlert: BillingAlert;
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Resolve live membership status (Kloqra-style effective status).
 * Does not mutate the database — callers may persist EXPIRED/GRACE when desired.
 */
export function resolveEffectiveSubscriptionStatus(input: ResolveEffectiveStatusInput): ResolveEffectiveStatusResult {
  const now = input.now ?? new Date();
  const graceDays = input.gracePeriodDays ?? DEFAULT_GRACE_DAYS;
  const stored = subscriptionStatusSchema.safeParse(input.status);
  const status: SubscriptionStatus = stored.success ? stored.data : "EXPIRED";
  let daysRemaining = 0;

  if (status === "CANCELLED" || status === "EXPIRED") {
    return { status, daysRemaining: 0, billingAlert: status === "CANCELLED" ? "canceling" : "expired" };
  }

  if (status === "COMPED") {
    const until = asDate(input.compedUntil);
    if (!until) {
      return { status: "COMPED", daysRemaining: 999, billingAlert: "comped" };
    }
    daysRemaining = daysUntil(until, now);
    if (daysRemaining < 0) {
      return { status: "EXPIRED", daysRemaining: 0, billingAlert: "expired" };
    }
    return { status: "COMPED", daysRemaining, billingAlert: "comped" };
  }

  if (status === "TRIAL") {
    const trialEnd = asDate(input.trialEndsAt);
    if (!trialEnd) {
      return { status: "EXPIRED", daysRemaining: 0, billingAlert: "expired" };
    }
    daysRemaining = daysUntil(trialEnd, now);
    if (daysRemaining > 0) {
      return {
        status: "TRIAL",
        daysRemaining,
        billingAlert: daysRemaining <= 7 ? "trial_ending" : "trial_active",
      };
    }
    const graceEnd = new Date(trialEnd.getTime() + graceDays * 24 * 60 * 60 * 1000);
    if (now < graceEnd) {
      return {
        status: "GRACE",
        daysRemaining: daysUntil(graceEnd, now),
        billingAlert: "grace",
      };
    }
    return { status: "EXPIRED", daysRemaining: 0, billingAlert: "expired" };
  }

  if (status === "ACTIVE" || status === "GRACE") {
    const periodEnd = asDate(input.currentPeriodEnd);
    if (!periodEnd) {
      // Active without period end — treat as active with unknown remaining.
      return {
        status: input.cancelAtPeriodEnd ? "ACTIVE" : status === "GRACE" ? "GRACE" : "ACTIVE",
        daysRemaining: status === "GRACE" ? 0 : 30,
        billingAlert: input.cancelAtPeriodEnd ? "canceling" : "none",
      };
    }
    daysRemaining = daysUntil(periodEnd, now);
    if (daysRemaining > 0) {
      return {
        status: "ACTIVE",
        daysRemaining,
        billingAlert: input.cancelAtPeriodEnd ? "canceling" : daysRemaining <= 14 ? "trial_ending" : "none",
      };
    }
    const graceEnd = new Date(periodEnd.getTime() + graceDays * 24 * 60 * 60 * 1000);
    if (now < graceEnd) {
      return {
        status: "GRACE",
        daysRemaining: daysUntil(graceEnd, now),
        billingAlert: "grace",
      };
    }
    return { status: "EXPIRED", daysRemaining: 0, billingAlert: "expired" };
  }

  return { status: "EXPIRED", daysRemaining: 0, billingAlert: "expired" };
}

export function resolveVendorPlanLimits(input: {
  status: string;
  planSlug?: string | null;
  limits?: Partial<VendorPlanLimits> | null;
}): VendorPlanLimits {
  const { status } = input;
  if (status === "TRIAL" || status === "GRACE" || status === "EXPIRED" || status === "CANCELLED") {
    return { ...TRIAL_VENDOR_CAPS, ...(input.limits ?? {}) };
  }
  const slug = canonicalizeVendorPlanSlug(input.planSlug ?? VENDOR_PLAN_SLUGS.PRO);
  const base =
    slug in DEFAULT_VENDOR_PLAN_LIMITS
      ? DEFAULT_VENDOR_PLAN_LIMITS[slug as VendorPlanSlug]
      : DEFAULT_VENDOR_PLAN_LIMITS[VENDOR_PLAN_SLUGS.PRO];
  return { ...base, ...(input.limits ?? {}) };
}
