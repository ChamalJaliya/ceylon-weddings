"use client";

import { type FormEvent, useEffect, useState } from "react";
import { api, isApiError, useAuthStore } from "@ceylonweddings/web";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { Input } from "@ceylonweddings/ui/components/input";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { SettingsCard, SettingsRow } from "../components/settings-card";

const ROLE_LABEL: Record<string, string> = {
  COUPLE: "Couple",
  FAMILY: "Family member",
  VENDOR: "Vendor",
  ADMIN: "Admin",
};

export default function ProfileSection() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  if (!user) return <CenteredLoader label="Loading your profile…" />;

  const dirty = name.trim() !== user.name || (phone.trim() || null) !== user.phone;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api.account.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setUser(updated);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <SettingsCard
        title="Your details"
        description="Shown to vendors you message and to family you invite."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() => {
                setName(user.name);
                setPhone(user.phone ?? "");
              }}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!dirty || saving || name.trim().length < 2}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <SettingsRow label="Full name" htmlFor="profile-name">
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            autoComplete="name"
            required
          />
        </SettingsRow>
        <SettingsRow label="Phone" hint="Vendors use this for WhatsApp follow-ups." htmlFor="profile-phone">
          <Input
            id="profile-phone"
            aria-describedby="profile-phone-hint"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            minLength={9}
            maxLength={20}
          />
        </SettingsRow>
        <SettingsRow label="Email" hint="Contact support to change your sign-in email." htmlFor="profile-email">
          <Input
            id="profile-email"
            aria-describedby="profile-email-hint"
            value={user.email}
            readOnly
            aria-readonly
            className="text-muted-foreground"
          />
        </SettingsRow>
        <SettingsRow label="Account">
          <div className="flex flex-wrap items-center gap-2">
            <Badge intent="info">{ROLE_LABEL[user.role] ?? user.role}</Badge>
            <span className="text-caption text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>
        </SettingsRow>
      </SettingsCard>
    </form>
  );
}
