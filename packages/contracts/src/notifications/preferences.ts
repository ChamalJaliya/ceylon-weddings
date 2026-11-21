import { z } from "zod";
import { dashboardLayoutsSchema } from "../dashboard/layout";

// ── Appearance (Kloqra: mode × palette) ─────────────────────────────────────

export const themeModeSchema = z.enum(["light", "dark", "system"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

/** "ceylon" is the brand default (pearl gold / night ink). The rest are optional palettes. */
export const paletteSchema = z.enum([
  "ceylon",
  "temple",
  "modern",
  "aurora",
  "noir",
  "sunset",
  "forest-walnut",
  "bordeaux-taupe",
  "midnight-ivory",
  "olive-linen",
  // Festive wedding moodboard palettes
  "sage-ivory",
  "champagne-gold",
  "dusty-blue-ivory",
  "blush-cream",
  "emerald-gold",
  "terracotta-sand",
  "lavender-taupe",
  "navy-gold",
  "mocha-ivory",
  "black-white",
  "peach-coral",
  "greenery-white",
]);
export type Palette = z.infer<typeof paletteSchema>;
export const DEFAULT_PALETTE: Palette = "ceylon";

export const PALETTE_OPTIONS: ReadonlyArray<{ value: Palette; label: string; description: string }> = [
  { value: "ceylon", label: "Ceylon", description: "Ivory and champagne gold" },
  { value: "temple", label: "Temple", description: "Sandalwood and kumkum maroon" },
  { value: "modern", label: "Modern", description: "Cool slate and sky" },
  { value: "aurora", label: "Aurora", description: "Fresh teal mint" },
  { value: "noir", label: "Noir", description: "High-contrast ink" },
  { value: "sunset", label: "Sunset", description: "Warm coral glow" },
  { value: "forest-walnut", label: "Forest & Walnut", description: "Forest green and walnut" },
  { value: "bordeaux-taupe", label: "Bordeaux & Taupe", description: "Bordeaux red and soft taupe" },
  { value: "midnight-ivory", label: "Midnight & Ivory", description: "Midnight navy and ivory" },
  { value: "olive-linen", label: "Olive & Linen", description: "Olive grove and warm linen" },
  { value: "sage-ivory", label: "Sage & Ivory", description: "Muted sage and creamy ivory" },
  { value: "champagne-gold", label: "Champagne & Gold", description: "Pale champagne and warm gold" },
  { value: "dusty-blue-ivory", label: "Dusty Blue & Ivory", description: "Slate blue and soft ivory" },
  { value: "blush-cream", label: "Blush & Cream", description: "Dusty rose and warm cream" },
  { value: "emerald-gold", label: "Emerald & Gold", description: "Deep emerald and antique gold" },
  { value: "terracotta-sand", label: "Terracotta & Sand", description: "Burnt clay and warm sand" },
  { value: "lavender-taupe", label: "Lavender & Taupe", description: "Soft lavender and warm taupe" },
  { value: "navy-gold", label: "Navy & Gold", description: "Midnight navy and antique gold" },
  { value: "mocha-ivory", label: "Mocha & Ivory", description: "Mocha mousse and creamy ivory" },
  { value: "black-white", label: "Black & White", description: "Formal black and crisp white" },
  { value: "peach-coral", label: "Peach & Coral", description: "Soft peach and festive coral" },
  { value: "greenery-white", label: "Greenery & White", description: "Fresh leaf green and bright white" },
];

// ── Notifications ───────────────────────────────────────────────────────────

/** Groups a user can switch on/off per channel in Settings → Notifications. */
export const notificationPreferenceKeySchema = z.enum([
  "messages",
  "leads",
  "reviews",
  "guests",
  "listing",
  "consultations",
]);
export type NotificationPreferenceKey = z.infer<typeof notificationPreferenceKeySchema>;

export const notificationChannelsSchema = z.object({ inApp: z.boolean(), email: z.boolean() });
export type NotificationChannels = z.infer<typeof notificationChannelsSchema>;

type Role = "COUPLE" | "FAMILY" | "VENDOR" | "ADMIN";

export const NOTIFICATION_PREFERENCES: ReadonlyArray<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
  roles: readonly Role[];
  defaults: NotificationChannels;
}> = [
  {
    key: "messages",
    label: "Messages",
    description: "New messages from couples, vendors, or the Ceylon Weddings team.",
    roles: ["COUPLE", "FAMILY", "VENDOR", "ADMIN"],
    defaults: { inApp: true, email: true },
  },
  {
    key: "leads",
    label: "New inquiries",
    description: "A couple asks about your services or a package.",
    roles: ["VENDOR"],
    defaults: { inApp: true, email: true },
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "A couple leaves a review on your storefront.",
    roles: ["VENDOR"],
    defaults: { inApp: true, email: true },
  },
  {
    key: "listing",
    label: "Listing status",
    description: "Your storefront is approved, featured, or needs changes.",
    roles: ["VENDOR"],
    defaults: { inApp: true, email: true },
  },
  {
    key: "guests",
    label: "Guest RSVPs",
    description: "A guest replies from your wedding website.",
    roles: ["COUPLE", "FAMILY"],
    defaults: { inApp: true, email: false },
  },
  {
    key: "consultations",
    label: "Consultations",
    description: "Free consultations are booked or cancelled.",
    roles: ["ADMIN"],
    defaults: { inApp: true, email: true },
  },
];

export const userPreferencesSchema = z
  .object({
    themeMode: themeModeSchema.optional(),
    palette: paletteSchema.optional(),
    notifications: z.partialRecord(notificationPreferenceKeySchema, notificationChannelsSchema.partial()).optional(),
    /** Widget dashboard arrangement per role dashboard. A bad value drops only this key. */
    dashboardLayouts: dashboardLayoutsSchema.optional().catch(undefined),
  })
  .catch({});
export type UserPreferences = z.infer<typeof userPreferencesSchema>;

/** Tolerant parse of the `User.preferences` JSON column. */
export function parseUserPreferences(raw: unknown): UserPreferences {
  return userPreferencesSchema.parse(raw ?? {});
}

/** Defaults merged with what the user switched. */
export function resolveNotificationChannels(
  prefs: UserPreferences,
  key: NotificationPreferenceKey,
): NotificationChannels {
  const fallback = NOTIFICATION_PREFERENCES.find((p) => p.key === key)?.defaults ?? { inApp: true, email: false };
  const chosen = prefs.notifications?.[key] ?? {};
  return { inApp: chosen.inApp ?? fallback.inApp, email: chosen.email ?? fallback.email };
}

export const updatePreferencesBodySchema = z.object({
  themeMode: themeModeSchema.optional(),
  palette: paletteSchema.optional(),
  notifications: z.partialRecord(notificationPreferenceKeySchema, notificationChannelsSchema.partial()).optional(),
  /** Replaces the saved layout of each dashboard kind given; other kinds are kept. */
  dashboardLayouts: dashboardLayoutsSchema.optional(),
});
export type UpdatePreferencesBody = z.infer<typeof updatePreferencesBodySchema>;
