"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, LaptopMinimal, ShieldCheck, ShieldOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { AccountSecurity, TwoFactorSetup } from "@ceylonweddings/contracts";
import { api, isApiError } from "@ceylonweddings/web";
import { AppModal } from "@ceylonweddings/ui/components/app-modal";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SkeletonText } from "@ceylonweddings/ui/components/skeleton";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { SettingsCard } from "../components/settings-card";

const errorText = (error: unknown, fallback: string) => (isApiError(error) ? error.message : fallback);

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Six-digit authenticator code input shared by enable / disable. */
function CodeInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      placeholder="123456"
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      className="text-center text-body-lg tracking-ornate"
      autoFocus
      required
    />
  );
}

// ── Password ────────────────────────────────────────────────────────────────

function PasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (next !== confirm) return setError("The new passwords don't match.");
    setSaving(true);
    setError(null);
    try {
      const result = await api.account.changePassword({ currentPassword: current, newPassword: next });
      toast.success(
        "Password changed",
        result.signedOut
          ? {
              description: `Signed out ${result.signedOut} other device${result.signedOut === 1 ? "" : "s"}.`,
            }
          : undefined,
      );
      onOpenChange(false);
    } catch (err) {
      setError(errorText(err, "Couldn't change your password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(value) => !saving && onOpenChange(value)}
      title="Change password"
      description="Other devices are signed out when you change it."
      icon={KeyRound}
      size="sm"
      preventOutsideClose
      footer={
        <>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="change-password" disabled={saving}>
            {saving ? "Saving…" : "Change password"}
          </Button>
        </>
      }
    >
      <form id="change-password" className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <p className="text-caption text-muted-foreground">At least 8 characters.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirm.length > 0 && confirm !== next}
            required
          />
        </div>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      </form>
    </AppModal>
  );
}

// ── Two-step verification ───────────────────────────────────────────────────

function EnableTwoFactorModal({
  open,
  onOpenChange,
  onEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setSetup(null);
      setCode("");
      setError(null);
      return;
    }
    api.account
      .startTwoFactor()
      .then(setSetup)
      .catch((err) => setError(errorText(err, "Couldn't start setup. Try again.")));
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.account.enableTwoFactor(code);
      toast.success("Two-step verification is on", { description: "You'll be asked for a code when you sign in." });
      onEnabled();
      onOpenChange(false);
    } catch (err) {
      setCode("");
      setError(errorText(err, "That code didn't match."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(value) => !busy && onOpenChange(value)}
      title="Turn on two-step verification"
      description="Scan the code with Google Authenticator, 1Password, or any authenticator app."
      icon={ShieldCheck}
      size="md"
      preventOutsideClose
      footer={
        <>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="enable-2fa" disabled={busy || !setup || code.length !== 6}>
            {busy ? "Checking…" : "Verify and turn on"}
          </Button>
        </>
      }
    >
      <form id="enable-2fa" className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <div className="grid size-40 place-items-center justify-self-center rounded-2xl border border-border bg-paper p-3">
            {setup ? (
              <QRCodeSVG value={setup.otpauthUri} size={136} level="M" title="Authenticator QR code" />
            ) : (
              <SkeletonText lines={4} className="w-full" />
            )}
          </div>
          <ol className="grid gap-2 text-compact text-muted-foreground">
            <li>1. Open your authenticator app and add an account.</li>
            <li>2. Scan this QR code, or enter the key below.</li>
            <li>3. Type the 6-digit code the app shows.</li>
          </ol>
        </div>
        {setup ? (
          <div className="grid gap-1.5">
            <Label>Setup key</Label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-inset px-3.5 py-2.5">
              <code className="min-w-0 flex-1 truncate font-mono text-compact tracking-label text-foreground">
                {setup.secret.replace(/(.{4})/g, "$1 ").trim()}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(setup.secret);
                  toast.success("Key copied");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="enable-code">Code from your app</Label>
          <CodeInput id="enable-code" value={code} onChange={setCode} />
        </div>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      </form>
    </AppModal>
  );
}

function DisableTwoFactorModal({
  open,
  onOpenChange,
  onDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisabled: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setCode("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.account.disableTwoFactor(code);
      toast.success("Two-step verification is off");
      onDisabled();
      onOpenChange(false);
    } catch (err) {
      setCode("");
      setError(errorText(err, "That code didn't match."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(value) => !busy && onOpenChange(value)}
      title="Turn off two-step verification?"
      description="Your account will only be protected by your password. Confirm with a code from your app."
      icon={ShieldOff}
      tone="warning"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Keep it on
          </Button>
          <Button type="submit" form="disable-2fa" variant="destructive" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Turn off"}
          </Button>
        </>
      }
    >
      <form id="disable-2fa" className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-1.5">
          <Label htmlFor="disable-code">Code from your app</Label>
          <CodeInput id="disable-code" value={code} onChange={setCode} />
        </div>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      </form>
    </AppModal>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function SecuritySection() {
  const confirm = useConfirm();
  const [security, setSecurity] = useState<AccountSecurity | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<"password" | "enable-2fa" | "disable-2fa" | null>(null);

  const load = useCallback(() => {
    api.account
      .security()
      .then((data) => {
        setSecurity(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(errorText(err, "Couldn't load your security settings.")));
  }, []);

  useEffect(load, [load]);

  if (loadError) return <FormStatus tone="destructive">{loadError}</FormStatus>;
  if (!security) {
    return (
      <div className="card card--raised grid gap-4 p-6">
        <SkeletonText lines={3} />
        <SkeletonText lines={2} />
      </div>
    );
  }

  const others = security.sessions.filter((s) => !s.current);

  return (
    <>
      <SettingsCard
        title="Password"
        description={
          security.hasPassword
            ? "Use a password you don't use anywhere else."
            : "You sign in with Google, so there is no password to change."
        }
        action={
          security.hasPassword ? (
            <Button type="button" variant="outline" onClick={() => setModal("password")}>
              Change password
            </Button>
          ) : null
        }
      />

      <SettingsCard
        title="Two-step verification"
        description="Ask for a code from your phone each time you sign in, so a stolen password isn't enough."
        action={security.twoFactorEnabled ? <Badge intent="success">On</Badge> : <Badge intent="outline">Off</Badge>}
        footer={
          security.twoFactorEnabled ? (
            <Button type="button" variant="ghost" onClick={() => setModal("disable-2fa")}>
              Turn off
            </Button>
          ) : (
            <Button type="button" iconLeft={ShieldCheck} onClick={() => setModal("enable-2fa")}>
              Set up
            </Button>
          )
        }
      />

      <SettingsCard
        title="Where you're signed in"
        description="Sessions last 30 days. Sign out any you don't recognise."
        footer={
          others.length ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const ok = await confirm({
                  title: "Sign out of all other devices?",
                  description: "You'll stay signed in here.",
                  confirmLabel: "Sign out others",
                  destructive: true,
                  onConfirm: () => api.account.revokeOtherSessions(),
                }).catch((err) => {
                  toast.error(errorText(err, "Couldn't sign out other devices."));
                  return false;
                });
                if (ok) {
                  toast.success("Signed out of other devices");
                  load();
                }
              }}
            >
              Sign out all other devices
            </Button>
          ) : null
        }
      >
        <SettingsList>
          {security.sessions.map((session) => (
            <SettingsListRow
              key={session.id}
              title={
                <>
                  Signed in {formatWhen(session.createdAt)}
                  {session.current ? (
                    <>
                      {" "}
                      <Badge intent="success">This device</Badge>
                    </>
                  ) : null}
                </>
              }
              meta={
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className="grid size-7 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon icon={LaptopMinimal} size="xs" lottie={false} />
                  </span>
                  Expires {formatWhen(session.expiresAt)}
                </span>
              }
              actions={
                !session.current ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Sign out this device?",
                        description: `Signed in ${formatWhen(session.createdAt)}.`,
                        confirmLabel: "Sign out",
                        destructive: true,
                        onConfirm: () => api.account.revokeSession(session.id),
                      }).catch((err) => {
                        toast.error(errorText(err, "Couldn't sign that device out."));
                        return false;
                      });
                      if (ok) {
                        toast.success("Device signed out");
                        load();
                      }
                    }}
                  >
                    Sign out
                  </Button>
                ) : null
              }
            />
          ))}
        </SettingsList>
      </SettingsCard>

      <PasswordModal open={modal === "password"} onOpenChange={(open) => setModal(open ? "password" : null)} />
      <EnableTwoFactorModal
        open={modal === "enable-2fa"}
        onOpenChange={(open) => setModal(open ? "enable-2fa" : null)}
        onEnabled={load}
      />
      <DisableTwoFactorModal
        open={modal === "disable-2fa"}
        onOpenChange={(open) => setModal(open ? "disable-2fa" : null)}
        onDisabled={load}
      />
    </>
  );
}
