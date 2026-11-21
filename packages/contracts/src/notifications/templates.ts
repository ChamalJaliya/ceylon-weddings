import { z } from "zod";
import type { NotificationChannels, NotificationPreferenceKey } from "./preferences";

/**
 * Notification catalog (Kloqra pattern): one typed template per event renders
 * the in-app row, the email subject/preheader and the CTA. Producers call
 * `notify({ templateId, context })`; channels come from the user's preferences.
 */

export const notificationVariantSchema = z.enum(["success", "attention", "warning", "info"]);
export type NotificationVariant = z.infer<typeof notificationVariantSchema>;

export const notificationCategorySchema = z.enum(["messages", "bookings", "planning", "listing", "account", "admin"]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  messages: "Messages",
  bookings: "Inquiries & reviews",
  planning: "Planning",
  listing: "Listing",
  account: "Account",
  admin: "Admin",
};

export const notificationDetailSchema = z.object({ label: z.string(), value: z.string() });

export const notificationMetadataSchema = z
  .object({
    variant: notificationVariantSchema.optional(),
    category: notificationCategorySchema.optional(),
    ctaLabel: z.string().optional(),
    details: z.array(notificationDetailSchema).optional(),
  })
  .catch({});
export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>;

export type RenderedNotification = {
  type: NotificationTemplateId;
  title: string;
  body: string;
  emailSubject: string;
  preheader: string;
  href: string;
  /** null = security notice: always in-app + email, not user-switchable. */
  preferenceKey: NotificationPreferenceKey | null;
  metadata: NotificationMetadata & { variant: NotificationVariant; category: NotificationCategory; ctaLabel: string };
};

type Ctx = {
  "message.received": { senderName: string; preview: string; href: string };
  "inquiry.received": {
    coupleName: string;
    message: string;
    preferredDate?: string | null;
    packageName?: string | null;
  };
  "review.received": { authorName: string; rating: number; excerpt: string; vendorSlug: string };
  "listing.approved": { vendorName: string; vendorSlug: string };
  "listing.rejected": { vendorName: string; note?: string | null };
  "listing.featured": { vendorName: string; vendorSlug: string };
  "rsvp.received": { guestName: string; status: "CONFIRMED" | "DECLINED" | "MAYBE" | "CONSIDERING"; plusCount: number };
  "consultation.booked": { name: string; when: string; topic?: string | null; consultationId: string };
  "consultation.cancelled": { name: string; when: string; consultationId: string };
  "account.passwordChanged": { signedOut: number };
  "account.twoFactorEnabled": Record<string, never>;
  "account.twoFactorDisabled": Record<string, never>;
};

export type NotificationTemplateContextMap = Ctx;
export type NotificationTemplateId = keyof Ctx;
export const NOTIFICATION_TEMPLATE_IDS = [
  "message.received",
  "inquiry.received",
  "review.received",
  "listing.approved",
  "listing.rejected",
  "listing.featured",
  "rsvp.received",
  "consultation.booked",
  "consultation.cancelled",
  "account.passwordChanged",
  "account.twoFactorEnabled",
  "account.twoFactorDisabled",
] as const satisfies readonly NotificationTemplateId[];

const clip = (text: string, max = 160) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
const RSVP_LABEL = {
  CONFIRMED: "is coming",
  DECLINED: "can't make it",
  MAYBE: "might come",
  CONSIDERING: "is still deciding",
} as const;

type Builder<T extends NotificationTemplateId> = (ctx: Ctx[T]) => Omit<RenderedNotification, "type">;

const BUILDERS: { [T in NotificationTemplateId]: Builder<T> } = {
  "message.received": (c) => ({
    title: c.senderName,
    body: clip(c.preview, 240),
    emailSubject: `New message from ${c.senderName}`,
    preheader: clip(c.preview, 90),
    href: c.href,
    preferenceKey: "messages",
    metadata: { variant: "info", category: "messages", ctaLabel: "Reply" },
  }),
  "inquiry.received": (c) => ({
    title: `New inquiry from ${c.coupleName}`,
    body: clip(c.message),
    emailSubject: `${c.coupleName} sent you an inquiry`,
    preheader: "Reply quickly — couples book the vendors who answer first.",
    href: "/pro/leads",
    preferenceKey: "leads",
    metadata: {
      variant: "attention",
      category: "bookings",
      ctaLabel: "Open leads",
      details: [
        ...(c.preferredDate ? [{ label: "Wedding date", value: c.preferredDate }] : []),
        ...(c.packageName ? [{ label: "Package", value: c.packageName }] : []),
      ],
    },
  }),
  "review.received": (c) => ({
    title: `${c.authorName} left a ${c.rating}★ review`,
    body: clip(c.excerpt),
    emailSubject: `New ${c.rating}★ review from ${c.authorName}`,
    preheader: clip(c.excerpt, 90),
    href: `/vendors/${c.vendorSlug}#reviews`,
    preferenceKey: "reviews",
    metadata: { variant: c.rating >= 4 ? "success" : "info", category: "bookings", ctaLabel: "See the review" },
  }),
  "listing.approved": (c) => ({
    title: "Your storefront is live",
    body: `${c.vendorName} is approved and visible to couples in search.`,
    emailSubject: `${c.vendorName} is now live on Ceylon Weddings`,
    preheader: "Couples can now find and message you.",
    href: `/vendors/${c.vendorSlug}`,
    preferenceKey: "listing",
    metadata: { variant: "success", category: "listing", ctaLabel: "View storefront" },
  }),
  "listing.rejected": (c) => ({
    title: "Your storefront needs changes",
    body: c.note ? clip(c.note) : `${c.vendorName} wasn't approved yet. Update your storefront and resubmit.`,
    emailSubject: `${c.vendorName}: a few changes before going live`,
    preheader: "Our team left a note on your storefront.",
    href: "/pro/storefront",
    preferenceKey: "listing",
    metadata: { variant: "warning", category: "listing", ctaLabel: "Edit storefront" },
  }),
  "listing.featured": (c) => ({
    title: "You're featured",
    body: `${c.vendorName} is now a featured pick on Ceylon Weddings.`,
    emailSubject: `${c.vendorName} is a featured pick`,
    preheader: "Featured vendors appear first for couples.",
    href: `/vendors/${c.vendorSlug}`,
    preferenceKey: "listing",
    metadata: { variant: "success", category: "listing", ctaLabel: "View storefront" },
  }),
  "rsvp.received": (c) => ({
    title: `${c.guestName} ${RSVP_LABEL[c.status]}`,
    body:
      c.status === "DECLINED"
        ? "They replied from your wedding website."
        : `Replied from your wedding website${c.plusCount ? ` with ${c.plusCount} guest${c.plusCount === 1 ? "" : "s"}` : ""}.`,
    emailSubject: `RSVP: ${c.guestName} ${RSVP_LABEL[c.status]}`,
    preheader: "A guest replied from your wedding website.",
    href: "/planning/guests",
    preferenceKey: "guests",
    metadata: {
      variant: c.status === "CONFIRMED" ? "success" : c.status === "DECLINED" ? "warning" : "info",
      category: "planning",
      ctaLabel: "Open guest list",
    },
  }),
  "consultation.booked": (c) => ({
    title: `Consultation booked by ${c.name}`,
    body: c.topic ? clip(c.topic) : `Scheduled for ${c.when}.`,
    emailSubject: `New consultation: ${c.name}, ${c.when}`,
    preheader: `Scheduled for ${c.when}.`,
    href: `/admin/consultations/${c.consultationId}`,
    preferenceKey: "consultations",
    metadata: {
      variant: "attention",
      category: "admin",
      ctaLabel: "Open consultation",
      details: [{ label: "When", value: c.when }],
    },
  }),
  "consultation.cancelled": (c) => ({
    title: `${c.name} cancelled a consultation`,
    body: `The ${c.when} slot is free again.`,
    emailSubject: `Consultation cancelled: ${c.name}`,
    preheader: `The ${c.when} slot is free again.`,
    href: `/admin/consultations/${c.consultationId}`,
    preferenceKey: "consultations",
    metadata: { variant: "warning", category: "admin", ctaLabel: "Open consultation" },
  }),
  "account.passwordChanged": (c) => ({
    title: "Your password was changed",
    body: c.signedOut
      ? `We signed out ${c.signedOut} other device${c.signedOut === 1 ? "" : "s"}. If this wasn't you, reset your password now.`
      : "If this wasn't you, reset your password now.",
    emailSubject: "Your Ceylon Weddings password was changed",
    preheader: "A security notice about your account.",
    href: "/settings/security",
    preferenceKey: null,
    metadata: { variant: "warning", category: "account", ctaLabel: "Review security" },
  }),
  "account.twoFactorEnabled": () => ({
    title: "Two-step verification is on",
    body: "You'll be asked for a code from your authenticator app when you sign in.",
    emailSubject: "Two-step verification turned on",
    preheader: "A security notice about your account.",
    href: "/settings/security",
    preferenceKey: null,
    metadata: { variant: "success", category: "account", ctaLabel: "Review security" },
  }),
  "account.twoFactorDisabled": () => ({
    title: "Two-step verification is off",
    body: "Your account is now protected by your password only. If this wasn't you, secure your account.",
    emailSubject: "Two-step verification turned off",
    preheader: "A security notice about your account.",
    href: "/settings/security",
    preferenceKey: null,
    metadata: { variant: "warning", category: "account", ctaLabel: "Review security" },
  }),
};

export function buildNotificationTemplate<T extends NotificationTemplateId>(
  templateId: T,
  context: Ctx[T],
): RenderedNotification {
  return { type: templateId, ...(BUILDERS[templateId] as Builder<T>)(context) };
}

/** Security notices ignore preferences. */
export const ALWAYS_ON: NotificationChannels = { inApp: true, email: true };
