"use client";

import { useState } from "react";
import { BellRing, Mail, ShieldCheck } from "lucide-react";
import {
  NOTIFICATION_PREFERENCES,
  resolveNotificationChannels,
  type NotificationChannels,
  type NotificationPreferenceKey,
} from "@ceylonweddings/contracts";
import { api, useAuthStore } from "@ceylonweddings/web";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { SettingsCard } from "../components/settings-card";

/**
 * Per-type channels (Kloqra notification preferences): each group can go to
 * the bell, to email, both, or neither. Security notices are always on.
 */
export default function NotificationsSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [saving, setSaving] = useState<string | null>(null);

  if (!user) return <CenteredLoader label="Loading your settings…" />;
  const rows = NOTIFICATION_PREFERENCES.filter((pref) => pref.roles.includes(user.role));

  async function toggle(key: NotificationPreferenceKey, channel: keyof NotificationChannels, value: boolean) {
    if (!user) return;
    const previous = user;
    const current = resolveNotificationChannels(user.preferences ?? {}, key);
    // Optimistic: flip locally, roll back on failure.
    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        notifications: { ...user.preferences?.notifications, [key]: { ...current, [channel]: value } },
      },
    });
    setSaving(`${key}.${channel}`);
    try {
      setUser(await api.account.updatePreferences({ notifications: { [key]: { [channel]: value } } }));
    } catch {
      setUser(previous);
      toast.error("Couldn't save that setting");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <SettingsCard
        title="What we tell you about"
        description={
          <>
            Choose where each kind of update goes. Emails go to <span className="text-foreground">{user.email}</span>.
          </>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 border-b border-border bg-inset px-4 py-2.5 sm:grid-cols-[1fr_6rem_6rem]">
            <span className="cw-eyebrow">Update</span>
            <span className="cw-eyebrow flex items-center justify-center gap-1.5">
              <Icon icon={BellRing} size="xs" lottie={false} />
              In-app
            </span>
            <span className="cw-eyebrow flex items-center justify-center gap-1.5">
              <Icon icon={Mail} size="xs" lottie={false} />
              Email
            </span>
          </div>
          <ul className="divide-y divide-border">
            {rows.map((pref) => {
              const channels = resolveNotificationChannels(user.preferences ?? {}, pref.key);
              return (
                <li
                  key={pref.key}
                  className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 px-4 py-3.5 sm:grid-cols-[1fr_6rem_6rem]"
                >
                  <span className="grid gap-0.5">
                    <span className="text-compact font-medium text-foreground">{pref.label}</span>
                    <span className="text-caption text-muted-foreground">{pref.description}</span>
                  </span>
                  {(["inApp", "email"] as const).map((channel) => (
                    <span key={channel} className="flex justify-center">
                      <Switch
                        checked={channels[channel]}
                        disabled={saving === `${pref.key}.${channel}`}
                        onCheckedChange={(value) => void toggle(pref.key, channel, value)}
                        aria-label={`${pref.label}: ${channel === "inApp" ? "in-app" : "email"}`}
                      />
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Security notices"
        description="Password changes and two-step verification updates always reach you by email and in the app, so you'd know if someone else got in."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-2.5 py-1 text-caption font-medium text-status-success-fg">
            <Icon icon={ShieldCheck} size="xs" lottie={false} />
            Always on
          </span>
        }
      />
    </>
  );
}
