import { z } from "zod";
import { roleSchema } from "../common";
import { vendorModerationStatusSchema } from "../admin/enums";
import { inquiryStatusSchema } from "../wedding/enums";

/** One day in a trend series. `date` is the Asia/Colombo calendar day (YYYY-MM-DD). */
export const dailyPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().int().nonnegative(),
});
export type DailyPoint = z.infer<typeof dailyPointSchema>;

/** Days covered by every insight series (oldest first, zero-filled). */
export const INSIGHT_WINDOW_DAYS = 30;

/** Totals for the current window and the one before it, for trend arrows. */
export const periodTotalsSchema = z.object({
  current: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative(),
});
export type PeriodTotals = z.infer<typeof periodTotalsSchema>;

// ── Admin: marketplace health ───────────────────────────────────────────────

export const adminInsightsSchema = z.object({
  days: z.number().int(),
  series: z.object({
    profileViews: z.array(dailyPointSchema),
    whatsappTaps: z.array(dailyPointSchema),
    inquiries: z.array(dailyPointSchema),
    signups: z.array(dailyPointSchema),
    newVendors: z.array(dailyPointSchema),
  }),
  totals: z.object({
    profileViews: periodTotalsSchema,
    whatsappTaps: periodTotalsSchema,
    inquiries: periodTotalsSchema,
    signups: periodTotalsSchema,
    newVendors: periodTotalsSchema,
  }),
  usersByRole: z.array(z.object({ role: roleSchema, count: z.number().int() })),
  vendorsByModeration: z.array(z.object({ status: vendorModerationStatusSchema, count: z.number().int() })),
  vendorsByCategory: z.array(z.object({ category: z.string(), label: z.string(), count: z.number().int() })),
  consultationsUpcoming: z.number().int(),
});
export type AdminInsights = z.infer<typeof adminInsightsSchema>;

// ── Vendor: storefront performance ──────────────────────────────────────────

export const vendorInsightsSchema = z.object({
  days: z.number().int(),
  series: z.object({
    profileViews: z.array(dailyPointSchema),
    whatsappTaps: z.array(dailyPointSchema),
    inquiries: z.array(dailyPointSchema),
  }),
  totals: z.object({
    profileViews: periodTotalsSchema,
    whatsappTaps: periodTotalsSchema,
    inquiries: periodTotalsSchema,
  }),
  leadsByStatus: z.array(z.object({ status: inquiryStatusSchema, count: z.number().int() })),
  /** Weddings that have this vendor on their team (shortlisted or booked). */
  shortlistedBy: z.number().int(),
  /** Of those, how many marked the vendor as booked. */
  bookedBy: z.number().int(),
});
export type VendorInsights = z.infer<typeof vendorInsightsSchema>;
