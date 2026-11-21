import { type LucideIcon, Bell, Globe, Palette, Shield, User } from "lucide-react";

/**
 * Settings sections (ported from Kloqra's settings-config). One list drives the
 * left tabs, the mobile picker, the header breadcrumb and settings search.
 */
export type SettingsSectionId = "profile" | "security" | "notifications" | "language" | "appearance";
export type SettingsGroupId = "account" | "preferences";

export type SettingsSection = {
  id: SettingsSectionId;
  group: SettingsGroupId;
  title: string;
  description: string;
  icon: LucideIcon;
  href: `/settings/${SettingsSectionId}`;
  /** Extra words settings search should match. */
  keywords: string[];
};

export const DEFAULT_SETTINGS_HREF = "/settings/profile";

export const SETTINGS_GROUPS: ReadonlyArray<{ id: SettingsGroupId; title: string }> = [
  { id: "account", title: "Account" },
  { id: "preferences", title: "Preferences" },
];

export const SETTINGS_SECTIONS: ReadonlyArray<SettingsSection> = [
  {
    id: "profile",
    group: "account",
    title: "Profile",
    description: "Your name and how vendors and family can reach you.",
    icon: User,
    href: "/settings/profile",
    keywords: ["name", "phone", "email", "contact", "account"],
  },
  {
    id: "security",
    group: "account",
    title: "Security",
    description: "Password, two-step verification, and signed-in devices.",
    icon: Shield,
    href: "/settings/security",
    keywords: ["password", "2fa", "two-factor", "authenticator", "sessions", "devices", "sign out"],
  },
  {
    id: "notifications",
    group: "preferences",
    title: "Notifications",
    description: "Choose which updates reach the bell and your inbox.",
    icon: Bell,
    href: "/settings/notifications",
    keywords: ["email", "alerts", "bell", "inquiries", "rsvp", "messages", "reviews", "mute"],
  },
  {
    id: "language",
    group: "preferences",
    title: "Language & region",
    description: "Language for the site and the currency prices are shown in.",
    icon: Globe,
    href: "/settings/language",
    keywords: ["sinhala", "tamil", "english", "currency", "lkr", "usd", "locale"],
  },
  {
    id: "appearance",
    group: "preferences",
    title: "Appearance",
    description: "Light or dark mode, and the palette that feels like your wedding.",
    icon: Palette,
    href: "/settings/appearance",
    keywords: ["theme", "mode", "dark", "light", "system", "palette", "temple", "aurora", "noir", "colour", "color"],
  },
];

export function sectionForPath(pathname: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
}

export function searchSettings(query: string): SettingsSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SETTINGS_SECTIONS.filter((s) =>
    [s.title, s.description, ...s.keywords].some((text) => text.toLowerCase().includes(q)),
  );
}
