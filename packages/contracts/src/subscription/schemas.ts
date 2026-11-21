import { z } from "zod";
import { billingIntervalSchema, subscriptionStatusSchema } from "../vendor/enums";
import { billingAlertSchema } from "./membership-access";
import {
  paymentProviderSchema,
  planBillingModeSchema,
  vendorPlanLimitsSchema,
  vendorPlanSlugSchema,
} from "./plan-catalog";

export const subscriptionPlanSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  interval: billingIntervalSchema,
  priceLkr: z.number().int(),
  features: z.array(z.string()),
  limits: vendorPlanLimitsSchema.nullable().optional(),
  billingMode: planBillingModeSchema,
  recommended: z.boolean(),
  sortOrder: z.number().int(),
  active: z.boolean(),
  stripePriceId: z.string().nullable().optional(),
  displayFeatures: z.array(z.string()).optional(),
});

export const subscriptionInvoiceSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  planId: z.string().nullable(),
  interval: billingIntervalSchema.nullable(),
  amountLkr: z.number().int(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: z.string(),
  paidAt: z.string().nullable(),
  paymentRef: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const subscriptionEventSchema = z.object({
  id: z.string(),
  subscriptionId: z.string(),
  vendorId: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
  actorUserId: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const vendorSubscriptionSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  status: subscriptionStatusSchema,
  trialEndsAt: z.string(),
  trialOverrideBy: z.string().nullable(),
  planId: z.string().nullable(),
  plan: subscriptionPlanSchema.nullable().optional(),
  interval: billingIntervalSchema.nullable(),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  gracePeriodDays: z.number().int(),
  cancelledAt: z.string().nullable(),
  cancelReason: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
  pendingPlanId: z.string().nullable().optional(),
  pendingInterval: billingIntervalSchema.nullable().optional(),
  compedById: z.string().nullable(),
  compedUntil: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  daysRemaining: z.number().int(),
  billingAlert: billingAlertSchema.optional(),
  limits: vendorPlanLimitsSchema.optional(),
  invoices: z.array(subscriptionInvoiceSchema).optional(),
  events: z.array(subscriptionEventSchema).optional(),
});

export const pricingCatalogSchema = z.object({
  plans: z.array(subscriptionPlanSchema),
  baselineFeatures: z.array(z.string()),
});

export const createCheckoutBodySchema = z.object({
  vendorId: z.string().min(1),
  planId: z.string().min(1),
  interval: billingIntervalSchema,
  /** Default payhere (LKR). Stripe for international cards. */
  provider: paymentProviderSchema.default("payhere"),
  returnUrl: z.string().min(1).optional(),
  cancelUrl: z.string().min(1).optional(),
});

export const paymentProvidersSchema = z.object({
  payhere: z.boolean(),
  stripe: z.boolean(),
  defaultProvider: paymentProviderSchema,
});

export const cancelSubscriptionBodySchema = z.object({
  reason: z.string().max(500).optional(),
  atPeriodEnd: z.boolean().default(true),
});

export const changeSubscriptionPlanBodySchema = z.object({
  planId: z.string().min(1),
  interval: billingIntervalSchema,
  /** When true and downgrading/changing interval, apply at period end. */
  scheduleForRenewal: z.boolean().optional(),
});

export const upsertSubscriptionPlanBodySchema = z.object({
  slug: vendorPlanSlugSchema.or(z.string().min(1).max(64)),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  interval: billingIntervalSchema,
  priceLkr: z.number().int().nonnegative(),
  features: z.array(z.string()).default([]),
  limits: vendorPlanLimitsSchema.partial().optional(),
  billingMode: planBillingModeSchema.default("checkout"),
  recommended: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  stripePriceId: z.string().min(1).nullable().optional(),
});

export const adminOverrideTrialBodySchema = z.object({
  trialEndsAt: z.string(),
  notes: z.string().optional(),
});

export const adminGrantCompedBodySchema = z.object({
  compedUntil: z.string().optional(),
  notes: z.string().optional(),
});

export const adminActivatePaidBodySchema = z.object({
  planId: z.string(),
  interval: billingIntervalSchema,
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionInvoice = z.infer<typeof subscriptionInvoiceSchema>;
export type SubscriptionEvent = z.infer<typeof subscriptionEventSchema>;
export type VendorSubscription = z.infer<typeof vendorSubscriptionSchema>;
export type PricingCatalog = z.infer<typeof pricingCatalogSchema>;
export type CreateCheckoutBody = z.infer<typeof createCheckoutBodySchema>;
export type PaymentProviders = z.infer<typeof paymentProvidersSchema>;
export type CancelSubscriptionBody = z.infer<typeof cancelSubscriptionBodySchema>;
export type ChangeSubscriptionPlanBody = z.infer<typeof changeSubscriptionPlanBodySchema>;
export type UpsertSubscriptionPlanBody = z.infer<typeof upsertSubscriptionPlanBodySchema>;
export type AdminOverrideTrialBody = z.infer<typeof adminOverrideTrialBodySchema>;
export type AdminGrantCompedBody = z.infer<typeof adminGrantCompedBodySchema>;
export type AdminActivatePaidBody = z.infer<typeof adminActivatePaidBodySchema>;
